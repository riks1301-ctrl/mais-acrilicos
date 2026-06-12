import { requireAdminSession } from "@/lib/instagram/auth";
import { syncPostMetrics } from "@/lib/instagram/metrics/sync";
import { NextResponse } from "next/server";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const result = await syncPostMetrics(params.id);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
