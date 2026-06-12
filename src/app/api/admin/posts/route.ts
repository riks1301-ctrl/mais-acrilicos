import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify, calculateReadingTime } from "@/lib/utils";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(3), excerpt: z.string().min(10), content: z.string().min(50),
  coverImage: z.string().optional(), metaTitle: z.string().optional(), metaDescription: z.string().optional(),
  keywords: z.string().optional(), published: z.boolean().default(false), featured: z.boolean().default(false), categoryId: z.string().optional(),
});

export async function GET() {
  if (!(await getSession())) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  return NextResponse.json(await prisma.post.findMany({ orderBy: { createdAt: "desc" }, include: { category: true } }));
}

export async function POST(req: Request) {
  if (!(await getSession())) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  try {
    const data = schema.parse(await req.json());
    const slug = slugify(data.title);
    const post = await prisma.post.create({
      data: { ...data, slug, coverImage: data.coverImage || null, metaTitle: data.metaTitle || data.title, metaDescription: data.metaDescription || data.excerpt, keywords: data.keywords || null, categoryId: data.categoryId || null, readingTime: calculateReadingTime(data.content), publishedAt: data.published ? new Date() : null },
    });
    return NextResponse.json(post, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0].message }, { status: 400 });
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
