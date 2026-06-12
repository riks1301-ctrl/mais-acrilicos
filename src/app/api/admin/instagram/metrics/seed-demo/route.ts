import { requireAdminSession } from "@/lib/instagram/auth";
import { seedDemoMetrics } from "@/lib/instagram/metrics/sync";
import { demoSeedSchema } from "@/lib/instagram/metrics/schemas";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function POST(req: Request) {
  const { error } = await requireAdminSession();
  if (error) return error;

  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Métricas demo não disponíveis em produção." }, { status: 403 });
  }
  if (process.env.INSTAGRAM_METRICS_DEMO !== "true") {
    return NextResponse.json(
      { error: "Demo desativado. Defina INSTAGRAM_METRICS_DEMO=true no .env para usar." },
      { status: 403 }
    );
  }

  try {
    demoSeedSchema.parse(await req.json().catch(() => ({})));
    const result = await seedDemoMetrics();
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Confirmação obrigatória: { confirm: true }" }, { status: 400 });
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erro" }, { status: 500 });
  }
}
