import { requireAdminSession } from "@/lib/instagram/auth";
import { loadPublishedPostsForDashboard } from "@/lib/instagram/metrics/queries";
import { NextResponse } from "next/server";

export async function GET() {
  const { error } = await requireAdminSession();
  if (error) return error;

  const posts = await loadPublishedPostsForDashboard();
  const items = posts.map((p) => ({
    id: p.id,
    title: p.title,
    format: p.format,
    contentType: p.contentType,
    publishedAt: p.publishedAt,
    instagramMediaId: p.instagramMediaId,
    performanceScore: p.performanceScore,
    hybridScore: p.hybridScore,
    scoreDelta: p.scoreDelta,
    lastMetricsSyncAt: p.lastMetricsSyncAt,
    latestMetric: p.metrics[0] ?? null,
    metricsCount: p.metrics.length,
  }));

  return NextResponse.json(items);
}
