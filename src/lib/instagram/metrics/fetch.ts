import { graphFetch } from "@/lib/instagram/meta/client";
import type { MetaConfig } from "@/lib/instagram/meta/types";
import { parseMetaError } from "@/lib/instagram/meta/errors";
import { finalizeSnapshot } from "./compute";
import type { MetricSnapshot } from "./types";

type InsightsResponse = {
  data?: { name: string; values?: { value: number }[] }[];
  error?: unknown;
};

type MediaFields = {
  like_count?: number;
  comments_count?: number;
  media_type?: string;
  timestamp?: string;
};

function parseInsightValue(data: InsightsResponse, name: string): number | null {
  const item = data.data?.find((d) => d.name === name);
  const val = item?.values?.[0]?.value;
  return typeof val === "number" ? val : null;
}

async function fetchInsightBatch(
  config: MetaConfig,
  mediaId: string,
  metrics: string[]
): Promise<{ values: Record<string, number | null>; unavailable: string[]; raw: unknown }> {
  const unavailable: string[] = [];
  const values: Record<string, number | null> = {};
  let raw: unknown = null;

  try {
    const res = await graphFetch<InsightsResponse>(config, `/${mediaId}/insights`, {
      params: { metric: metrics.join(",") },
    });
    raw = res;
    for (const m of metrics) {
      const v = parseInsightValue(res, m);
      if (v == null) unavailable.push(m);
      else values[m] = v;
    }
  } catch (e) {
    const meta = e && typeof e === "object" && "meta" in e ? (e as { meta: ReturnType<typeof parseMetaError> }).meta : parseMetaError(e);
    for (const m of metrics) unavailable.push(m);
    raw = { error: meta.message, code: meta.code };
  }

  return { values, unavailable, raw };
}

/**
 * Busca métricas reais via Meta Graph API.
 * Métricas indisponíveis ficam null — nunca inventadas.
 */
export async function fetchMediaMetrics(config: MetaConfig, mediaId: string): Promise<MetricSnapshot> {
  const unavailable: string[] = [];
  const rawInsights: Record<string, unknown> = {};

  let likes: number | null = null;
  let comments: number | null = null;

  try {
    const media = await graphFetch<MediaFields>(config, `/${mediaId}`, {
      params: { fields: "like_count,comments_count,media_type,timestamp" },
    });
    rawInsights.media = media;
    likes = media.like_count ?? null;
    comments = media.comments_count ?? null;
  } catch (e) {
    unavailable.push("like_count", "comments_count");
    rawInsights.media_error = e instanceof Error ? e.message : "erro";
  }

  const batch1 = await fetchInsightBatch(config, mediaId, ["reach", "views", "saved", "shares", "total_interactions"]);
  const batch2 = await fetchInsightBatch(config, mediaId, ["impressions", "profile_visits", "follows", "website_clicks"]);

  rawInsights.insights_batch1 = batch1.raw;
  rawInsights.insights_batch2 = batch2.raw;
  unavailable.push(...batch1.unavailable, ...batch2.unavailable);

  const reach = batch1.values.reach ?? null;
  const impressions = batch2.values.impressions ?? batch1.values.views ?? null;
  const saves = batch1.values.saved ?? null;
  const shares = batch1.values.shares ?? null;
  const profileVisits = batch2.values.profile_visits ?? batch1.values.profile_activity ?? null;
  const linkClicks = batch2.values.website_clicks ?? null;

  return finalizeSnapshot({
    reach,
    impressions,
    likes,
    comments,
    saves,
    shares,
    profileVisits,
    linkClicks,
    whatsappClicks: null,
    leads: null,
    unavailableMetrics: Array.from(new Set(unavailable)),
    rawInsights,
  });
}
