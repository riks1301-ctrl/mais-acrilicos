import { requireAdminSession } from "@/lib/instagram/auth";
import { analyzePerformance } from "@/lib/instagram/metrics/analysis";
import { generateRecommendations } from "@/lib/instagram/metrics/recommendations";
import { loadPublishedPostsForDashboard } from "@/lib/instagram/metrics/queries";
import { NextResponse } from "next/server";

export async function GET() {
  const { error } = await requireAdminSession();
  if (error) return error;

  const posts = await loadPublishedPostsForDashboard();
  const analysis = analyzePerformance(posts);
  return NextResponse.json(generateRecommendations(analysis));
}
