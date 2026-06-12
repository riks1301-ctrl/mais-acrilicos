import { requireAdminSession } from "@/lib/instagram/auth";
import { verifyCronSecret } from "@/lib/instagram/cron-auth";
import { syncPublishedMetrics } from "@/lib/instagram/metrics/sync";
import { NextResponse } from "next/server";

const RATE_LIMIT_MS = 60_000;
let lastRunAt = 0;

export async function POST(req: Request) {
  const cronSecret = req.headers.get("x-cron-secret");
  const expectedSecret = process.env.META_METRICS_CRON_SECRET ?? process.env.META_PUBLISH_CRON_SECRET;

  if (!verifyCronSecret(cronSecret, expectedSecret)) {
    const { error } = await requireAdminSession();
    if (error) return error;
  }

  const now = Date.now();
  if (now - lastRunAt < RATE_LIMIT_MS) {
    return NextResponse.json({ ok: false, error: "Rate limit: aguarde 60s" }, { status: 429 });
  }
  lastRunAt = now;

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 10), 25);

  const result = await syncPublishedMetrics(limit);
  return NextResponse.json(result);
}
