import { requireAdminSession } from "@/lib/instagram/auth";
import { generateFullContent, requireBrand } from "@/lib/instagram/generator";
import { saveFullGeneration } from "@/lib/instagram/persistence";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdminSession();
  if (error) return error;

  try {
    const brand = await requireBrand();
    const post = await prisma.instagramPost.findUnique({ where: { id: params.id } });
    if (!post) return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });

    const idea = {
      title: post.title,
      idea: post.idea ?? post.title,
      contentType: post.contentType ?? ("RETAIL_TIPS" as const),
      format: post.format,
    };

    const gen = generateFullContent(brand, idea);
    const updated = await saveFullGeneration(params.id, gen);

    return NextResponse.json({
      post: updated,
      critique: gen.critique,
      captions: gen.captions,
    });
  } catch (e) {
    if (e instanceof Error) return NextResponse.json({ error: e.message }, { status: 400 });
    return NextResponse.json({ error: "Erro ao gerar conteúdo" }, { status: 500 });
  }
}
