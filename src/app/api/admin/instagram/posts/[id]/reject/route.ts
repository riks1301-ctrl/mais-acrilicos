import { requireAdminSession } from "@/lib/instagram/auth";
import { rejectPostSchema } from "@/lib/instagram/approval/schemas";
import { rejectPost } from "@/lib/instagram/approval/service";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { session, error } = await requireAdminSession();
  if (error || !session) return error ?? NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { reason } = rejectPostSchema.parse(await req.json());
    const post = await rejectPost(params.id, session.sub, reason);
    return NextResponse.json(post);
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0].message }, { status: 400 });
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erro" }, { status: 400 });
  }
}
