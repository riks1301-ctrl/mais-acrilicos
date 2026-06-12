import { requireAdminSession } from "@/lib/instagram/auth";
import { linkImageToPostSchema } from "@/lib/instagram/images/schemas";
import { logPublication } from "@/lib/instagram/persistence";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const links = await prisma.instagramPostImage.findMany({
    where: { postId: params.id },
    orderBy: { order: "asc" },
    include: { image: { include: { service: true } } },
  });

  return NextResponse.json(links);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdminSession();
  if (error) return error;

  try {
    const data = linkImageToPostSchema.parse(await req.json());

    const count = await prisma.instagramPostImage.count({ where: { postId: params.id } });

    const link = await prisma.instagramPostImage.upsert({
      where: { postId_imageId: { postId: params.id, imageId: data.imageId } },
      create: {
        postId: params.id,
        imageId: data.imageId,
        role: data.role,
        order: data.order ?? count,
      },
      update: { role: data.role, order: data.order },
      include: { image: true },
    });

    await logPublication(params.id, "image_linked", { imageId: data.imageId, role: data.role });
    return NextResponse.json(link, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0].message }, { status: 400 });
    return NextResponse.json({ error: "Erro ao vincular imagem" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const imageId = searchParams.get("imageId");
  if (!imageId) return NextResponse.json({ error: "imageId obrigatório" }, { status: 400 });

  await prisma.instagramPostImage.delete({
    where: { postId_imageId: { postId: params.id, imageId } },
  });

  await logPublication(params.id, "image_unlinked", { imageId });
  return NextResponse.json({ ok: true });
}
