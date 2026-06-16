import type { InstagramPost } from "@prisma/client";
import { loadMetaConfig, validateMetaConfig } from "./config";
import { checkMetaImageUrl } from "@/lib/instagram/drive/meta-publish";

type PostWithMedia = InstagramPost & {
  postImages: {
    role: string;
    order: number;
    image: {
      id: string;
      url: string;
      status: string;
      sourceProvider?: string;
      metaPublishReady?: boolean;
      metaPublishUrl?: string | null;
    };
  }[];
  carousel: { id: string; slides?: unknown[] } | null;
};

export type PublishEligibility = {
  ok: boolean;
  errors: string[];
  warnings: string[];
  imageUrl?: string;
  caption?: string;
  unsupportedFormat?: boolean;
};

function absolutePublicUrl(url: string): string | null {
  if (url.startsWith("https://")) return url;
  if (url.startsWith("http://")) return null;
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (!site) return null;
  if (url.startsWith("/")) return `${site.replace(/\/$/, "")}${url}`;
  return null;
}

export function buildPublishCaption(post: InstagramPost): string {
  const caption = post.finalCaption?.trim() ?? "";
  const hashtags = post.finalHashtags?.trim() ?? "";
  if (caption && hashtags) return `${caption}\n\n${hashtags}`;
  return caption || hashtags;
}

export async function checkPostPublishEligibility(
  post: PostWithMedia,
  options: { requireScheduled?: boolean; allowApproved?: boolean } = {}
): Promise<PublishEligibility> {
  const errors: string[] = [];
  const warnings: string[] = [];

  const config = await loadMetaConfig();
  const metaCheck = validateMetaConfig(config);
  if (!metaCheck.ok) errors.push(...metaCheck.errors);
  warnings.push(...metaCheck.warnings);

  if (config.mode === "DISABLED") errors.push("Integração Meta desativada.");

  if (!post.approvedAt) errors.push("Post não foi aprovado manualmente.");

  if (["IDEA", "CREATING", "PENDING_APPROVAL", "REJECTED"].includes(post.status)) {
    errors.push("Rascunhos, pendentes ou reprovados não podem ser publicados.");
  }

  const channel = post.publicationChannel ?? (post.format === "CAROUSEL" ? "CAROUSEL" : post.format === "REELS" ? "REELS" : post.format === "STORY" ? "STORY" : "FEED");

  if (channel === "STORY" || channel === "REELS" || post.format === "REELS" || post.format === "STORY") {
    return {
      ok: false,
      errors: [...errors, "UNSUPPORTED_BY_CURRENT_IMPLEMENTATION: Stories e Reels não são publicados automaticamente nesta versão."],
      warnings,
      unsupportedFormat: true,
    };
  }

  if (channel === "CAROUSEL" || post.format === "CAROUSEL") {
    warnings.push("Carrossel via Meta API em fase preparada — publicação automática de carrossel desabilitada.");
    if (post.postImages.length < 2) errors.push("Carrossel requer pelo menos 2 imagens públicas vinculadas.");
    errors.push("Publicação automática de carrossel desabilitada por segurança. Use Feed com imagem única ou publicação manual.");
    return { ok: false, errors, warnings, unsupportedFormat: true };
  }

  if (options.requireScheduled && post.status !== "SCHEDULED") {
    errors.push("Publicação automática exige status SCHEDULED.");
  } else if (!options.requireScheduled) {
    if (!options.allowApproved && post.status !== "SCHEDULED") {
      errors.push("Status inválido para publicação automática.");
    }
    if (options.allowApproved && !["APPROVED", "SCHEDULED"].includes(post.status)) {
      errors.push("Somente posts APPROVED ou SCHEDULED podem ser publicados via API.");
    }
  }

  if (post.status === "SCHEDULED" && !post.scheduledFor) {
    errors.push("Post agendado sem data/hora (scheduledFor).");
  }

  if (options.requireScheduled) {
    if (!post.scheduledFor) errors.push("Data/hora de agendamento ausente.");
    else if (post.scheduledFor > new Date()) errors.push("Agendamento ainda não atingiu data/hora.");
  }

  const caption = buildPublishCaption(post);
  if (!caption || caption.length < 20) errors.push("Legenda final ausente ou muito curta.");

  const cover =
    post.postImages.find((pi) => pi.role === "cover") ??
    post.postImages.sort((a, b) => a.order - b.order)[0];

  if (!cover) errors.push("Imagem principal não vinculada ao post.");

  let imageUrl: string | undefined;
  if (cover) {
    if (cover.image.status === "ARCHIVED") errors.push("Imagem principal está arquivada.");

    const publishUrl = cover.image.metaPublishReady && cover.image.metaPublishUrl ? cover.image.metaPublishUrl : cover.image.url;
    const metaCheck = checkMetaImageUrl(publishUrl);
    const absolute = absolutePublicUrl(publishUrl);

    if (cover.image.sourceProvider === "google_drive" || cover.image.sourceProvider === "local_dev") {
      if (!metaCheck.ok) {
        warnings.push(
          `${metaCheck.reason} Na publicação, o sistema criará cópia HTTPS temporária (Blob) automaticamente.`
        );
      }
    }

    if (!absolute && cover.image.sourceProvider === "upload") {
      errors.push("URL da imagem deve ser HTTPS pública acessível pela Meta (configure NEXT_PUBLIC_SITE_URL).");
    } else if (absolute) {
      imageUrl = absolute;
    } else if (cover.image.sourceProvider !== "upload") {
      warnings.push("URL de preview local/Drive — será resolvida na hora da publicação.");
      imageUrl = publishUrl.startsWith("https://") ? publishUrl : undefined;
    }
  }

  if (post.status === "PUBLISHED" && post.instagramMediaId) {
    errors.push("Post já publicado.");
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    imageUrl,
    caption,
  };
}

