import { prisma } from "@/lib/prisma";
import { logPublication } from "@/lib/instagram/persistence";
import { loadMetaConfig, validateMetaConfig } from "@/lib/instagram/meta/config";
import { parseCommercialScore } from "@/lib/instagram/approval/utils";
import { fetchMediaMetrics } from "./fetch";
import { performanceScoreFromRate } from "./compute";
import { hybridScore, scoreDelta } from "./compute";
import type { MetricSnapshot, SyncResult } from "./types";
import type { Prisma } from "@prisma/client";

const POST_INCLUDE = {
  postImages: { orderBy: { order: "asc" as const }, include: { image: { include: { service: true } } } },
  metrics: { orderBy: { collectedAt: "desc" as const } },
};

async function accountAvgEngagementRate(): Promise<number | null> {
  const latest = await prisma.instagramMetric.findMany({
    orderBy: { collectedAt: "desc" },
    take: 100,
    where: { engagementRate: { not: null } },
  });
  if (latest.length === 0) return null;
  const sum = latest.reduce((a, m) => a + (m.engagementRate ?? 0), 0);
  return sum / latest.length;
}

async function saveMetricSnapshot(postId: string, snapshot: MetricSnapshot) {
  return prisma.instagramMetric.create({
    data: {
      postId,
      reach: snapshot.reach,
      impressions: snapshot.impressions,
      likes: snapshot.likes,
      comments: snapshot.comments,
      saves: snapshot.saves,
      shares: snapshot.shares,
      profileVisits: snapshot.profileVisits,
      linkClicks: snapshot.linkClicks,
      whatsappClicks: snapshot.whatsappClicks,
      leads: snapshot.leads,
      totalEngagement: snapshot.totalEngagement,
      engagementRate: snapshot.engagementRate,
      unavailableMetrics: snapshot.unavailableMetrics,
      rawInsights: snapshot.rawInsights as Prisma.InputJsonValue,
      source: "meta",
    },
  });
}

async function updatePostScores(postId: string, critiqueNotes: string | null, engagementRate: number | null) {
  const avg = await accountAvgEngagementRate();
  const predicted = parseCommercialScore(critiqueNotes);
  const performanceScore = performanceScoreFromRate(engagementRate, avg);
  const hybrid = hybridScore(predicted, performanceScore);
  const delta = scoreDelta(predicted, performanceScore);

  await prisma.instagramPost.update({
    where: { id: postId },
    data: {
      performanceScore,
      hybridScore: hybrid,
      scoreDelta: delta,
      lastMetricsSyncAt: new Date(),
    },
  });
}

export async function syncPostMetrics(postId: string): Promise<{ ok: boolean; error?: string; metricId?: string }> {
  const config = await loadMetaConfig();
  const validation = validateMetaConfig(config);
  if (!validation.ok && config.mode === "DISABLED") {
    return { ok: false, error: "Meta não configurado ou desativado." };
  }

  const post = await prisma.instagramPost.findUnique({ where: { id: postId }, include: POST_INCLUDE });
  if (!post) return { ok: false, error: "Post não encontrado." };
  if (post.status !== "PUBLISHED") return { ok: false, error: "Somente posts PUBLISHED têm métricas sincronizadas." };
  if (!post.instagramMediaId) return { ok: false, error: "Post sem instagramMediaId da Meta." };

  try {
    const snapshot = await fetchMediaMetrics(config, post.instagramMediaId);
    const metric = await saveMetricSnapshot(postId, snapshot);
    await updatePostScores(postId, post.critiqueNotes, snapshot.engagementRate);

    await logPublication(postId, "metrics_synced", {
      metricId: metric.id,
      reach: snapshot.reach,
      engagementRate: snapshot.engagementRate,
      unavailable: snapshot.unavailableMetrics,
    });

    return { ok: true, metricId: metric.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao sincronizar métricas";
    await logPublication(postId, "metrics_sync_failed", { error: msg }, msg);
    return { ok: false, error: msg };
  }
}

export async function syncPublishedMetrics(limit = 10): Promise<SyncResult> {
  const config = await loadMetaConfig();
  if (config.mode === "DISABLED" || !config.accessToken) {
    return {
      ok: false,
      synced: [],
      skipped: [],
      failed: [{ id: "—", error: "Meta não configurado" }],
      processed: 0,
    };
  }

  const posts = await prisma.instagramPost.findMany({
    where: { status: "PUBLISHED", instagramMediaId: { not: null } },
    orderBy: [{ lastMetricsSyncAt: "asc" }, { publishedAt: "desc" }],
    take: limit,
    select: { id: true, instagramMediaId: true },
  });

  const synced: string[] = [];
  const skipped: { id: string; reason: string }[] = [];
  const failed: { id: string; error: string }[] = [];

  for (const post of posts) {
    if (!post.instagramMediaId) {
      skipped.push({ id: post.id, reason: "Sem mediaId" });
      continue;
    }
    const result = await syncPostMetrics(post.id);
    if (result.ok) synced.push(post.id);
    else failed.push({ id: post.id, error: result.error ?? "erro" });
  }

  const logPostId = synced[0] ?? posts[0]?.id;
  if (logPostId) {
    await logPublication(logPostId, "metrics_bulk_sync", {
      synced: synced.length,
      failed: failed.length,
      processed: posts.length,
    });
  }

  return { ok: true, synced, skipped, failed, processed: posts.length };
}

/** Dados demo para desenvolvimento — não chama Meta. */
export async function seedDemoMetrics(): Promise<SyncResult> {
  const posts = await prisma.instagramPost.findMany({
    where: { status: "PUBLISHED" },
    take: 5,
    include: { metrics: true },
  });

  if (posts.length === 0) {
    return { ok: false, synced: [], skipped: [], failed: [{ id: "—", error: "Nenhum post PUBLISHED para demo" }], processed: 0 };
  }

  const synced: string[] = [];
  const baseReach = [420, 890, 1200, 310, 650];

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const reach = baseReach[i % baseReach.length];
    const likes = Math.round(reach * (0.04 + i * 0.005));
    const comments = Math.round(likes * 0.08);
    const saves = Math.round(likes * 0.12);
    const shares = Math.round(likes * 0.03);
    const total = likes + comments + saves + shares;
    const rate = Math.round((total / reach) * 10000) / 100;

    const snapshot: MetricSnapshot = {
      reach,
      impressions: Math.round(reach * 1.2),
      likes,
      comments,
      saves,
      shares,
      profileVisits: Math.round(reach * 0.02),
      linkClicks: null,
      whatsappClicks: null,
      leads: null,
      totalEngagement: total,
      engagementRate: rate,
      unavailableMetrics: ["whatsappClicks", "linkClicks"],
      rawInsights: { demo: true },
    };

    await saveMetricSnapshot(post.id, { ...snapshot, rawInsights: { demo: true } });
    await updatePostScores(post.id, post.critiqueNotes, rate);
    synced.push(post.id);
  }

  return { ok: true, synced, skipped: [], failed: [], processed: posts.length };
}
