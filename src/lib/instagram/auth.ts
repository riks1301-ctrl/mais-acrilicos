import { getSession } from "@/lib/auth";
import { assertProductionSecrets } from "@/lib/env-security";
import { NextResponse } from "next/server";

export async function requireAdminSession() {
  assertProductionSecrets();
  const session = await getSession();
  if (!session) return { session: null, error: NextResponse.json({ error: "Não autorizado" }, { status: 401 }) };
  return { session, error: null };
}
