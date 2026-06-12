import { sanitizeMetricForClient } from "@/lib/instagram/sanitize";
import { prisma } from "@/lib/prisma";
import type { PostWithMetricsContext } from "./types";

const POST_METRICS_INCLUDE = {
  postImages: {
    orderBy: { order: "asc" as const },
    include: { image: { include: { service: true } } },
  },
  metrics: { orderBy: { collectedAt: "desc" as const } },
};

export async function loadPostsWithMetrics(filters?: { status?: string; postId?: string }): Promise<PostWithMetricsContext[]> {
  const posts = await prisma.instagramPost.findMany({
    where: {
      ...(filters?.postId ? { id: filters.postId } : {}),
      ...(filters?.status ? { status: filters.status as never } : {}),
    },
    include: POST_METRICS_INCLUDE,
    orderBy: { publishedAt: "desc" },
  });

  return posts.map((p) => ({
    id: p.id,
    title: p.title,
    format: p.format,
    contentType: p.contentType,
    status: p.status,
    publishedAt: p.publishedAt,
    scheduledFor: p.scheduledFor,
    finalCta: p.finalCta,
    finalCaption: p.finalCaption,
    critiqueNotes: p.critiqueNotes,
    visualSource: p.visualSource,
    instagramMediaId: p.instagramMediaId,
    performanceScore: p.performanceScore,
    hybridScore: p.hybridScore,
    scoreDelta: p.scoreDelta,
    lastMetricsSyncAt: p.lastMetricsSyncAt,
    postImages: p.postImages,
    metrics: p.metrics.map((m) => {
      const safe = sanitizeMetricForClient(m);
      return {
        id: safe.id,
        reach: safe.reach,
        impressions: safe.impressions,
        likes: safe.likes,
        comments: safe.comments,
        saves: safe.saves,
        shares: safe.shares,
        profileVisits: safe.profileVisits,
        linkClicks: safe.linkClicks,
        whatsappClicks: safe.whatsappClicks,
        leads: safe.leads,
        totalEngagement: safe.totalEngagement,
        engagementRate: safe.engagementRate,
        unavailableMetrics: safe.unavailableMetrics,
        collectedAt: safe.collectedAt,
        source: safe.source,
      };
    }),
  }));
}

export async function loadPublishedPostsForDashboard() {
  return loadPostsWithMetrics({ status: "PUBLISHED" });
}
