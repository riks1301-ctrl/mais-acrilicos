import { prisma } from "@/lib/prisma";
import { logPublication } from "@/lib/instagram/persistence";
import { sanitizeMetaError, parseMetaError } from "./errors";
import { loadMetaConfig } from "./config";
import { checkPostPublishEligibility } from "./eligibility";
import { createMediaContainer, getMediaStatus, publishMediaContainer } from "./media";
import type { MetaPublishResult } from "./types";

const POST_INCLUDE = {
  postImages: { orderBy: { order: "asc" as const }, include: { image: true } },
  carousel: { include: { slides: true } },
};

async function waitForContainerReady(config: Awaited<ReturnType<typeof loadMetaConfig>>, containerId: string, attempts = 5) {
  for (let i = 0; i < attempts; i++) {
    const status = await getMediaStatus(config, containerId);
    if (status.status_code === "FINISHED" || status.status_code === "PUBLISHED") return status;
    await new Promise((r) => setTimeout(r, 2000));
  }
  return null;
}

export async function publishSingleImagePost(
  postId: string,
  options: {
    adminId?: string;
    manual?: boolean;
    requireScheduled?: boolean;
  } = {}
): Promise<MetaPublishResult> {
  const config = await loadMetaConfig();
  const post = await prisma.instagramPost.findUnique({ where: { id: postId }, include: POST_INCLUDE });
  if (!post) throw new Error("Post não encontrado");

  const eligibility = await checkPostPublishEligibility(post, {
    requireScheduled: options.requireScheduled ?? false,
    allowApproved: options.manual ?? !options.requireScheduled,
  });

  if (!eligibility.ok) {
    const error = eligibility.errors.join(" ");
    await prisma.instagramPost.update({
      where: { id: postId },
      data: { metaPublishError: error, metaLastPublishAttempt: new Date() },
    });
    await logPublication(postId, "meta_publish_failed", {
      adminId: options.adminId,
      errors: eligibility.errors,
      warnings: eligibility.warnings,
      mode: config.mode,
    });
    return { ok: false, testMode: config.mode === "TEST", error };
  }

  const imageUrl = eligibility.imageUrl!;
  const caption = eligibility.caption!;

  await prisma.instagramPost.update({
    where: { id: postId },
    data: { metaLastPublishAttempt: new Date(), metaPublishMode: config.mode.toLowerCase() },
  });

  if (config.mode === "TEST") {
    await logPublication(postId, "meta_publish_test_mode", {
      adminId: options.adminId,
      imageUrl,
      captionPreview: caption.slice(0, 120),
      mode: "test",
    });
    return { ok: true, testMode: true, mediaContainerId: "TEST_CONTAINER", mediaId: "TEST_MEDIA" };
  }

  try {
    const container = await createMediaContainer(config, { imageUrl, caption });
    await waitForContainerReady(config, container.id);
    const published = await publishMediaContainer(config, container.id);

    await prisma.instagramPost.update({
      where: { id: postId },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
        instagramMediaId: published.id,
        metaMediaContainerId: container.id,
        metaPublishError: null,
        manualPublished: false,
      },
    });

    await logPublication(postId, "meta_published", {
      adminId: options.adminId,
      mediaContainerId: container.id,
      mediaId: published.id,
      mode: config.mode,
      manual: options.manual ?? false,
    });

    return { ok: true, testMode: false, mediaContainerId: container.id, mediaId: published.id };
  } catch (e) {
    const meta = e && typeof e === "object" && "meta" in e ? (e as { meta: ReturnType<typeof parseMetaError> }).meta : parseMetaError(e);
    const sanitized = sanitizeMetaError(meta);

    await prisma.instagramPost.update({
      where: { id: postId },
      data: { metaPublishError: sanitized, status: "ERROR" },
    });

    await logPublication(postId, "meta_publish_failed", {
      adminId: options.adminId,
      error: sanitized,
      fbtrace_id: meta.fbtrace_id,
      code: meta.code,
      mode: config.mode,
    });

    return { ok: false, testMode: false, error: sanitized, sanitizedError: sanitized };
  }
}

export async function runDuePublications(limit = 5) {
  if (process.env.INSTAGRAM_AUTO_PUBLISH !== "true") {
    return { ok: false, skipped: true, reason: "INSTAGRAM_AUTO_PUBLISH=false no .env", published: [], failed: [] };
  }

  const config = await loadMetaConfig();
  if (!config.autoPublish) {
    return { ok: false, skipped: true, reason: "Publicação automática desligada no painel Meta", published: [], failed: [] };
  }
  if (config.mode !== "ACTIVE") {
    return { ok: false, skipped: true, reason: `Modo Meta é ${config.mode}`, published: [], failed: [] };
  }

  const due = await prisma.instagramPost.findMany({
    where: {
      status: "SCHEDULED",
      scheduledFor: { lte: new Date() },
      NOT: {
        OR: [
          { publicationChannel: { in: ["CAROUSEL", "STORY", "REELS"] } },
          { format: { in: ["CAROUSEL", "STORY", "REELS"] } },
        ],
      },
    },
    orderBy: { scheduledFor: "asc" },
    take: limit,
    include: POST_INCLUDE,
  });

  const published: string[] = [];
  const failed: { id: string; error: string }[] = [];

  for (const post of due) {
    const result = await publishSingleImagePost(post.id, { requireScheduled: true });
    if (result.ok) published.push(post.id);
    else failed.push({ id: post.id, error: result.error ?? "erro" });
  }

  return { ok: true, published, failed, processed: due.length };
}
