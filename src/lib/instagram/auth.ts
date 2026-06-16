import { getSession } from "@/lib/auth";
import { assertProductionSecrets } from "@/lib/env-security";
import { NextResponse } from "next/server";

export async function requireAdminSession() {
  try {
    assertProductionSecrets();
  } catch (e) {
    const message = e instanceof Error ? e.message : "Configuração do servidor inválida.";
    return { session: null, error: NextResponse.json({ error: message }, { status: 503 }) };
  }

  const session = await getSession();
  if (!session) return { session: null, error: NextResponse.json({ error: "Não autorizado" }, { status: 401 }) };
  return { session, error: null };
}
