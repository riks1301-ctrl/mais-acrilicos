import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateArticleFromKeyword, templateToPostData } from "@/lib/seo-generator";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function GET() {
  if (!(await getSession())) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const [pending, generated, total] = await Promise.all([
    prisma.seoArticleQueue.count({ where: { status: "pending" } }),
    prisma.seoArticleQueue.count({ where: { status: "generated" } }),
    prisma.seoArticleQueue.count(),
  ]);
  return NextResponse.json({ pending, generated, total });
}

export async function POST(req: Request) {
  if (!(await getSession())) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { count, publish } = z.object({ count: z.number().min(1).max(50).default(10), publish: z.boolean().default(false) }).parse(await req.json());
  const pending = await prisma.seoArticleQueue.findMany({ where: { status: "pending" }, take: count, orderBy: { createdAt: "asc" } });
  if (!pending.length) return NextResponse.json({ error: "Fila vazia" }, { status: 404 });
  const categories = Object.fromEntries((await prisma.category.findMany()).map((c) => [c.slug, c.id]));
  const titles: string[] = [];
  for (const item of pending) {
    const template = generateArticleFromKeyword(item.keywords.split(",")[0].trim(), item.category || "displays-acrilico");
    const postData = templateToPostData(template);
    if (await prisma.post.findUnique({ where: { slug: postData.slug } })) { await prisma.seoArticleQueue.update({ where: { id: item.id }, data: { status: "skipped" } }); continue; }
    const post = await prisma.post.create({ data: { ...postData, published: publish, publishedAt: publish ? new Date() : null, categoryId: categories[item.category || ""] || null, seoScore: 85 } });
    await prisma.seoArticleQueue.update({ where: { id: item.id }, data: { status: "generated", postId: post.id, generatedAt: new Date() } });
    titles.push(post.title);
  }
  return NextResponse.json({ success: true, generated: titles.length, titles });
}
