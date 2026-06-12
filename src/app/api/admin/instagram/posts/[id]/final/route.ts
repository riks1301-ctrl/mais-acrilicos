import { requireAdminSession } from "@/lib/instagram/auth";
import { finalPostEditSchema } from "@/lib/instagram/approval/schemas";
import { saveFinalContent } from "@/lib/instagram/approval/service";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdminSession();
  if (error) return error;

  try {
    const data = finalPostEditSchema.parse(await req.json());
    const post = await saveFinalContent(params.id, {
      ...data,
      suggestedDate: data.suggestedDate === null ? null : data.suggestedDate ? new Date(data.suggestedDate) : undefined,
    });
    return NextResponse.json(post);
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0].message }, { status: 400 });
    return NextResponse.json({ error: "Erro ao salvar conteúdo final" }, { status: 500 });
  }
}
