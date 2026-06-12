import { requireAdminSession } from "@/lib/instagram/auth";
import { updateIgPostSchema } from "@/lib/instagram/schemas";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const post = await prisma.instagramPost.findUnique({
    where: { id: params.id },
    include: {
      captions: { orderBy: { version: "asc" } },
      calendarEntries: true,
      publicationLogs: { orderBy: { createdAt: "desc" }, take: 20 },
      imagePrompts: { orderBy: { createdAt: "desc" } },
      postImages: { orderBy: { order: "asc" }, include: { image: { include: { service: true } } } },
      carousel: { include: { slides: { orderBy: { order: "asc" }, include: { backgroundImage: true } } } },
    },
  });

  if (!post) return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });
  return NextResponse.json(post);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdminSession();
  if (error) return error;

  try {
    const raw = await req.json();
    const forbidden = ["status", "scheduledFor", "publishedAt", "instagramMediaId", "manualPublished", "approvedAt"];
    for (const key of forbidden) {
      if (key in raw) {
        return NextResponse.json(
          { error: `Campo "${key}" não pode ser alterado aqui. Use aprovação, agendamento ou publicação Meta.` },
          { status: 400 }
        );
      }
    }
    const data = updateIgPostSchema.parse(raw);
    const { selectedCaptionId, ...rest } = data;

    if (selectedCaptionId) {
      await prisma.instagramCaption.updateMany({ where: { postId: params.id }, data: { isSelected: false } });
      await prisma.instagramCaption.update({ where: { id: selectedCaptionId }, data: { isSelected: true } });
    }

    const post = await prisma.instagramPost.update({
      where: { id: params.id },
      data: rest,
      include: {
        captions: true,
        postImages: { include: { image: true } },
        carousel: { include: { slides: true } },
        imagePrompts: true,
      },
    });

    return NextResponse.json(post);
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0].message }, { status: 400 });
    return NextResponse.json({ error: "Erro ao atualizar post" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdminSession();
  if (error) return error;

  await prisma.instagramPost.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
