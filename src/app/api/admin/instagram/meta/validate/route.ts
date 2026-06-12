import { requireAdminSession } from "@/lib/instagram/auth";
import { validateAndSaveMetaConnection } from "@/lib/instagram/meta/config";
import { NextResponse } from "next/server";

export async function POST() {
  const { error } = await requireAdminSession();
  if (error) return error;

  const result = await validateAndSaveMetaConnection();
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
