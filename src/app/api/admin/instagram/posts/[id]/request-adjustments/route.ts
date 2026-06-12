import { requireAdminSession } from "@/lib/instagram/auth";
import { requestAdjustmentsSchema } from "@/lib/instagram/approval/schemas";
import { requestAdjustments } from "@/lib/instagram/approval/service";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { session, error } = await requireAdminSession();
  if (error || !session) return error ?? NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { notes } = requestAdjustmentsSchema.parse(await req.json());
    const post = await requestAdjustments(params.id, session.sub, notes);
    return NextResponse.json(post);
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0].message }, { status: 400 });
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erro" }, { status: 400 });
  }
}
