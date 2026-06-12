import { getAgentStatus } from "@/lib/instagram/agent-status";
import { requireAdminSession } from "@/lib/instagram/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const { error } = await requireAdminSession();
  if (error) return error;

  return NextResponse.json(await getAgentStatus());
}
