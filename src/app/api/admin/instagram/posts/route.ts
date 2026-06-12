import { requireAdminSession } from "@/lib/instagram/auth";
import { generateIdeas, requireBrand } from "@/lib/instagram/generator";
import { saveIdeaAsPost } from "@/lib/instagram/persistence";
import { generateIdeasSchema } from "@/lib/instagram/schemas";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function GET(req: Request) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const brand = await prisma.instagramBrandConfig.findFirst({ orderBy: { createdAt: "asc" } });

  const posts = await prisma.instagramPost.findMany({
    where: {
      ...(brand ? { brandConfigId: brand.id } : {}),
      ...(status ? { status: status as never } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      captions: { orderBy: { version: "asc" } },
      calendarEntries: true,
    },
    take: 100,
  });

  return NextResponse.json(posts);
}

export async function POST(req: Request) {
  const { error } = await requireAdminSession();
  if (error) return error;

  try {
    const body = await req.json();

    if (body.action === "generate_ideas") {
      const input = generateIdeasSchema.parse(body);
      const brand = await requireBrand();
      const ideas = generateIdeas(brand, input.count, input.contentType);

      if (!input.save) return NextResponse.json({ ideas });

      const posts = [];
      for (const idea of ideas) {
        posts.push(await saveIdeaAsPost(brand, idea));
      }
      return NextResponse.json({ ideas, posts }, { status: 201 });
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0].message }, { status: 400 });
    if (e instanceof Error) return NextResponse.json({ error: e.message }, { status: 400 });
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
