import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateReadingTime } from "@/lib/utils";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(3).optional(), excerpt: z.string().optional(), content: z.string().optional(),
  coverImage: z.string().nullable().optional(), metaTitle: z.string().optional(), metaDescription: z.string().optional(),
  keywords: z.string().optional(), published: z.boolean().optional(), featured: z.boolean().optional(), categoryId: z.string().nullable().optional(),
});

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  if (!(await getSession())) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const data = schema.parse(await req.json());
  const existing = await prisma.post.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  const post = await prisma.post.update({
    where: { id: params.id },
    data: { ...data, readingTime: data.content ? calculateReadingTime(data.content) : undefined, publishedAt: data.published && !existing.publishedAt ? new Date() : existing.publishedAt },
  });
  return NextResponse.json(post);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  if (!(await getSession())) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  await prisma.post.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
