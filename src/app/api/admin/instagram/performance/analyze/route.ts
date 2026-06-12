import { requireAdminSession } from "@/lib/instagram/auth";
import { analyzePerformance } from "@/lib/instagram/metrics/analysis";
import { generateRecommendations } from "@/lib/instagram/metrics/recommendations";
import { loadPublishedPostsForDashboard } from "@/lib/instagram/metrics/queries";
import { NextResponse } from "next/server";

export async function POST() {
  const { error } = await requireAdminSession();
  if (error) return error;

  const posts = await loadPublishedPostsForDashboard();
  const analysis = analyzePerformance(posts);
  const recommendations = generateRecommendations(analysis);

  return NextResponse.json({ analysis, recommendations });
}
