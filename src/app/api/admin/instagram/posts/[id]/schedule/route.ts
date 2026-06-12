import { requireAdminSession } from "@/lib/instagram/auth";
import { schedulePostSchema } from "@/lib/instagram/approval/schemas";
import { cancelSchedule, schedulePost } from "@/lib/instagram/approval/service";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { session, error } = await requireAdminSession();
  if (error || !session) return error ?? NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const data = schedulePostSchema.parse(await req.json());
    const post = await schedulePost(params.id, session.sub, {
      scheduledFor: new Date(data.scheduledFor),
      publicationChannel: data.publicationChannel,
      publicationNotes: data.publicationNotes,
    });
    return NextResponse.json(post);
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0].message }, { status: 400 });
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erro" }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { session, error } = await requireAdminSession();
  if (error || !session) return error ?? NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const post = await cancelSchedule(params.id, session.sub);
  return NextResponse.json(post);
}
