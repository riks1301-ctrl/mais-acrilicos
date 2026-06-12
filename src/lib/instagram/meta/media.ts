import { graphFetch } from "./client";
import type { MetaConfig } from "./types";

export async function createMediaContainer(
  config: MetaConfig,
  params: { imageUrl: string; caption: string; isCarouselItem?: boolean }
): Promise<{ id: string }> {
  if (!config.igBusinessAccountId) throw new Error("Instagram Business Account ID não configurado");

  const body: Record<string, string> = {
    image_url: params.imageUrl,
    caption: params.caption,
  };
  if (params.isCarouselItem) body.is_carousel_item = "true";

  return graphFetch(config, `/${config.igBusinessAccountId}/media`, { method: "POST", body });
}

export async function createCarouselContainer(
  config: MetaConfig,
  params: { childrenIds: string[]; caption: string }
): Promise<{ id: string }> {
  if (!config.igBusinessAccountId) throw new Error("Instagram Business Account ID não configurado");

  return graphFetch(config, `/${config.igBusinessAccountId}/media`, {
    method: "POST",
    body: {
      media_type: "CAROUSEL",
      children: params.childrenIds.join(","),
      caption: params.caption,
    },
  });
}

export async function publishMediaContainer(config: MetaConfig, creationId: string): Promise<{ id: string }> {
  if (!config.igBusinessAccountId) throw new Error("Instagram Business Account ID não configurado");

  return graphFetch(config, `/${config.igBusinessAccountId}/media_publish`, {
    method: "POST",
    body: { creation_id: creationId },
  });
}

export async function getMediaStatus(config: MetaConfig, containerId: string): Promise<{ status_code?: string; id?: string }> {
  return graphFetch(config, `/${containerId}`, { params: { fields: "status_code,id" } });
}
