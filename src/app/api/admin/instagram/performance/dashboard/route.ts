import { requireAdminSession } from "@/lib/instagram/auth";
import { analyzePerformance } from "@/lib/instagram/metrics/analysis";
import { loadPublishedPostsForDashboard } from "@/lib/instagram/metrics/queries";
import { NextResponse } from "next/server";

export async function GET() {
  const { error } = await requireAdminSession();
  if (error) return error;

  const posts = await loadPublishedPostsForDashboard();
  const analysis = analyzePerformance(posts);

  return NextResponse.json({
    ...analysis,
    posts: posts.map((p) => ({
      id: p.id,
      title: p.title,
      format: p.format,
      contentType: p.contentType,
      publishedAt: p.publishedAt,
      performanceScore: p.performanceScore,
      hybridScore: p.hybridScore,
      scoreDelta: p.scoreDelta,
      latestMetric: p.metrics[0] ?? null,
    })),
  });
}
