import { requireAdminSession } from "@/lib/instagram/auth";
import { buildHybridScoreResult } from "@/lib/instagram/metrics/hybrid-score";
import { loadPostsWithMetrics } from "@/lib/instagram/metrics/queries";
import { analyzePerformance } from "@/lib/instagram/metrics/analysis";
import { generateRecommendations } from "@/lib/instagram/metrics/recommendations";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const posts = await loadPostsWithMetrics({ postId: params.id });
  const post = posts[0];
  if (!post) return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });

  const allPublished = await loadPostsWithMetrics({ status: "PUBLISHED" });
  const analysis = analyzePerformance(allPublished);
  const avgRate = analysis.avgEngagementRate;

  const hybrid = buildHybridScoreResult(post.critiqueNotes, post.metrics[0] ?? null, avgRate);
  const postRecs = generateRecommendations(analysis).filter((r) => r.postId === post.id || !r.postId).slice(0, 5);

  return NextResponse.json({
    post: {
      id: post.id,
      title: post.title,
      status: post.status,
      format: post.format,
      publishedAt: post.publishedAt,
      instagramMediaId: post.instagramMediaId,
      lastMetricsSyncAt: post.lastMetricsSyncAt,
    },
    metrics: post.metrics,
    hybrid,
    recommendations: postRecs,
  });
}
