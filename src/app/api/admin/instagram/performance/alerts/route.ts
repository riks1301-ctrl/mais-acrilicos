import { requireAdminSession } from "@/lib/instagram/auth";
import { generateAlerts } from "@/lib/instagram/metrics/alerts";
import { NextResponse } from "next/server";

export async function GET() {
  const { error } = await requireAdminSession();
  if (error) return error;

  return NextResponse.json(await generateAlerts());
}
