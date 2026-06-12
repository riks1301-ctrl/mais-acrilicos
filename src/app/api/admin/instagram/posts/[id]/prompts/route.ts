import { requireAdminSession } from "@/lib/instagram/auth";
import { generateAllPrompts } from "@/lib/instagram/generator/image-prompts";
import { getBrandContextWithServices } from "@/lib/instagram/generator/context";
import { generatePromptsSchema } from "@/lib/instagram/images/schemas";
import { logPublication } from "@/lib/instagram/persistence";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const prompts = await prisma.instagramImagePrompt.findMany({
    where: { postId: params.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(prompts);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdminSession();
  if (error) return error;

  try {
    const brand = await getBrandContextWithServices();
    if (!brand) return NextResponse.json({ error: "Configure a marca primeiro." }, { status: 400 });

    const post = await prisma.instagramPost.findUnique({ where: { id: params.id } });
    if (!post) return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });

    const input = generatePromptsSchema.parse(await req.json().catch(() => ({})));
    const generated = generateAllPrompts(
      brand,
      { title: post.title, idea: post.idea, contentType: post.contentType },
      input.imageType,
      input.purposes
    );

    await prisma.instagramImagePrompt.deleteMany({ where: { postId: params.id } });

    const saved = [];
    for (const g of generated) {
      saved.push(
        await prisma.instagramImagePrompt.create({
          data: {
            postId: params.id,
            prompt: g.prompt,
            format: g.format,
            purpose: g.purpose,
            imageType: g.imageType,
            isConcept: g.isConcept,
            styleNotes: g.styleNotes,
          },
        })
      );
    }

    await prisma.instagramPost.update({
      where: { id: params.id },
      data: {
        visualSource: input.imageType === "REAL" ? "REAL" : input.imageType === "MOCKUP" ? "MOCKUP" : "AI",
      },
    });

    await logPublication(params.id, "prompts_generated", { count: saved.length, imageType: input.imageType });
    return NextResponse.json(saved, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0].message }, { status: 400 });
    return NextResponse.json({ error: "Erro ao gerar prompts" }, { status: 500 });
  }
}
