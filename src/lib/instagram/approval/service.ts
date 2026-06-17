import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logPublication } from "@/lib/instagram/persistence";
import { canApprovePost, validateScheduleDate } from "./utils";

const postInclude = {
  captions: { orderBy: { version: "asc" as const } },
  postImages: { orderBy: { order: "asc" as const }, include: { image: { include: { service: true } } } },
  carousel: { include: { slides: { orderBy: { order: "asc" as const } } } },
  calendarEntries: { orderBy: { date: "asc" as const }, take: 1 },
  approvals: { orderBy: { reviewedAt: "desc" as const } },
  publicationLogs: { orderBy: { createdAt: "desc" as const }, take: 30 },
} satisfies Prisma.InstagramPostInclude;

export async function getApprovalQueue(statuses?: string[]) {
  const defaultStatuses = ["PENDING_APPROVAL", "APPROVED", "REJECTED", "SCHEDULED"];
  const filter = statuses?.length ? statuses : defaultStatuses;

  return prisma.instagramPost.findMany({
    where: { status: { in: filter as never[] } },
    orderBy: [{ status: "asc" }, { scheduledFor: "asc" }, { createdAt: "desc" }],
    include: postInclude,
  });
}

export async function getPostForApproval(postId: string) {
  return prisma.instagramPost.findUnique({ where: { id: postId }, include: postInclude });
}

export async function approvePost(
  postId: string,
  adminId: string,
  options: { forceLowScore?: boolean; forceNoVisual?: boolean } = {}
) {
  const post = await getPostForApproval(postId);
  if (!post) throw new Error("Post não encontrado");

  const check = canApprovePost(post, options);
  if (!check.ok) {
    const err = new Error(check.error) as Error & { code?: string };
    err.code = check.code;
    throw err;
  }

  const updated = await prisma.instagramPost.update({
    where: { id: postId },
    data: {
      status: "APPROVED",
      approvedAt: new Date(),
      rejectedAt: null,
      rejectionReason: null,
      approvedByAdminId: adminId,
    },
    include: postInclude,
  });

  await prisma.instagramApproval.create({
    data: { postId, adminId, status: "approved", notes: "Aprovado manualmente" },
  });

  await logPublication(postId, "approved", { adminId, forceLowScore: options.forceLowScore, forceNoVisual: options.forceNoVisual });
  return updated;
}

export async function rejectPost(postId: string, adminId: string, reason: string) {
  const updated = await prisma.instagramPost.update({
    where: { id: postId },
    data: {
      status: "REJECTED",
      rejectedAt: new Date(),
      rejectionReason: reason,
      approvedAt: null,
      approvedByAdminId: null,
      scheduledFor: null,
      publicationChannel: null,
      publicationNotes: null,
    },
    include: postInclude,
  });

  await prisma.instagramApproval.create({
    data: { postId, adminId, status: "rejected", notes: reason },
  });

  await logPublication(postId, "rejected", { adminId, reason });
  return updated;
}

export async function requestAdjustments(postId: string, adminId: string, notes: string) {
  const updated = await prisma.instagramPost.update({
    where: { id: postId },
    data: { status: "CREATING", internalNotes: notes },
    include: postInclude,
  });

  await prisma.instagramApproval.create({
    data: { postId, adminId, status: "adjustments_requested", notes },
  });

  await logPublication(postId, "adjustments_requested", { adminId, notes });
  return updated;
}

export async function saveFinalContent(
  postId: string,
  data: {
    title?: string;
    finalCaption: string;
    finalCta: string;
    finalHashtags: string;
    format?: "FEED" | "CAROUSEL" | "STORY" | "REELS";
    suggestedDate?: Date | null;
    internalNotes?: string | null;
    primaryImageId?: string | null;
  }
) {
  if (data.primaryImageId) {
    await prisma.instagramPostImage.updateMany({ where: { postId }, data: { role: "attachment" } });
    await prisma.instagramPostImage.updateMany({
      where: { postId, imageId: data.primaryImageId },
      data: { role: "cover", order: 0 },
    });
  }

  const updated = await prisma.instagramPost.update({
    where: { id: postId },
    data: {
      title: data.title,
      finalCaption: data.finalCaption,
      finalCta: data.finalCta,
      finalHashtags: data.finalHashtags,
      format: data.format,
      suggestedDate: data.suggestedDate,
      internalNotes: data.internalNotes,
    },
    include: postInclude,
  });

  await logPublication(postId, "final_content_saved", { title: data.title });
  return updated;
}

export async function schedulePost(
  postId: string,
  adminId: string,
  data: { scheduledFor: Date; publicationChannel: "FEED" | "STORY" | "REELS" | "CAROUSEL"; publicationNotes?: string }
) {
  const post = await getPostForApproval(postId);
  if (!post) throw new Error("Post não encontrado");
  if (post.status !== "APPROVED" && post.status !== "SCHEDULED") {
    throw new Error("Apenas posts aprovados podem ser agendados.");
  }

  const dateCheck = validateScheduleDate(data.scheduledFor);
  if (!dateCheck.ok) throw new Error(dateCheck.error);

  const updated = await prisma.instagramPost.update({
    where: { id: postId },
    data: {
      status: "SCHEDULED",
      scheduledFor: data.scheduledFor,
      publicationChannel: data.publicationChannel,
      publicationNotes: data.publicationNotes ?? null,
      format: data.publicationChannel === "CAROUSEL" ? "CAROUSEL" : data.publicationChannel === "REELS" ? "REELS" : data.publicationChannel === "STORY" ? "STORY" : post.format,
    },
    include: postInclude,
  });

  await logPublication(postId, "scheduled", {
    adminId,
    scheduledFor: data.scheduledFor.toISOString(),
    channel: data.publicationChannel,
  });

  return updated;
}

export async function cancelSchedule(postId: string, adminId: string) {
  const updated = await prisma.instagramPost.update({
    where: { id: postId },
    data: { status: "APPROVED", scheduledFor: null, publicationChannel: null, publicationNotes: null },
    include: postInclude,
  });

  await logPublication(postId, "schedule_cancelled", { adminId });
  return updated;
}

export async function manualPublish(postId: string, adminId: string, notes: string) {
  const post = await getPostForApproval(postId);
  if (!post) throw new Error("Post não encontrado");
  if (!["APPROVED", "SCHEDULED"].includes(post.status)) {
    throw new Error("Apenas posts aprovados ou agendados podem ser marcados como publicados.");
  }

  const updated = await prisma.instagramPost.update({
    where: { id: postId },
    data: {
      status: "PUBLISHED",
      publishedAt: new Date(),
      manualPublished: true,
      publicationNotes: notes,
    },
    include: postInclude,
  });

  await logPublication(postId, "manual_published", { adminId, notes });
  return updated;
}
