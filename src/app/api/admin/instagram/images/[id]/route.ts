import { requireAdminSession } from "@/lib/instagram/auth";
import { updateImageSchema } from "@/lib/instagram/images/schemas";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const image = await prisma.instagramImage.findUnique({
    where: { id: params.id },
    include: { service: true, postImages: { include: { post: true } } },
  });

  if (!image) return NextResponse.json({ error: "Imagem não encontrada" }, { status: 404 });
  return NextResponse.json(image);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdminSession();
  if (error) return error;

  try {
    const data = updateImageSchema.parse(await req.json());

    const image = await prisma.instagramImage.update({
      where: { id: params.id },
      data: {
        ...data,
        isRealPhoto: data.imageType ? data.imageType === "REAL" : undefined,
        isConcept: data.imageType ? data.imageType === "CONCEPT" || data.imageType === "MOCKUP" : undefined,
        isGenerated: data.imageType ? data.imageType === "COMMERCIAL_ART" : undefined,
      },
      include: { service: true },
    });

    return NextResponse.json(image);
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0].message }, { status: 400 });
    return NextResponse.json({ error: "Erro ao atualizar imagem" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdminSession();
  if (error) return error;

  await prisma.instagramImage.update({
    where: { id: params.id },
    data: { status: "ARCHIVED" },
  });

  return NextResponse.json({ ok: true });
}
