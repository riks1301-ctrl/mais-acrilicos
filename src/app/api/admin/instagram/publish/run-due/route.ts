import { requireAdminSession } from "@/lib/instagram/auth";
import { verifyCronSecret } from "@/lib/instagram/cron-auth";
import { runDuePublications } from "@/lib/instagram/meta/publish";
import { NextResponse } from "next/server";

const RATE_LIMIT_MS = 60_000;
let lastRunAt = 0;

export async function POST(req: Request) {
  const cronSecret = req.headers.get("x-cron-secret");
  const expectedSecret = process.env.META_PUBLISH_CRON_SECRET;

  if (!verifyCronSecret(cronSecret, expectedSecret)) {
    const { error } = await requireAdminSession();
    if (error) return error;
  }

  const now = Date.now();
  if (now - lastRunAt < RATE_LIMIT_MS) {
    return NextResponse.json({ ok: false, error: "Rate limit: aguarde 60s entre execuções" }, { status: 429 });
  }
  lastRunAt = now;

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 5), 10);

  const result = await runDuePublications(limit);
  return NextResponse.json(result);
}
