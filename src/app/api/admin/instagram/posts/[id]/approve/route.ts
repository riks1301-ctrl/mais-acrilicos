import { requireAdminSession } from "@/lib/instagram/auth";
import { approvePostSchema } from "@/lib/instagram/approval/schemas";
import { approvePost } from "@/lib/instagram/approval/service";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { session, error } = await requireAdminSession();
  if (error || !session) return error ?? NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = approvePostSchema.parse(await req.json().catch(() => ({})));
    const post = await approvePost(params.id, session.sub, body);
    return NextResponse.json(post);
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0].message }, { status: 400 });
    const err = e as Error & { code?: string };
    return NextResponse.json({ error: err.message, code: err.code }, { status: 400 });
  }
}
