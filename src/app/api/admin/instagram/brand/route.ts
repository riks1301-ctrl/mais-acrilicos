import { requireAdminSession } from "@/lib/instagram/auth";
import { sanitizeBrandForClient } from "@/lib/instagram/sanitize";
import { brandConfigSchema } from "@/lib/instagram/schemas";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function GET() {
  const { error } = await requireAdminSession();
  if (error) return error;

  const brand = await prisma.instagramBrandConfig.findFirst({
    include: { personas: { orderBy: { createdAt: "asc" } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(sanitizeBrandForClient(brand));
}

export async function PUT(req: Request) {
  const { error } = await requireAdminSession();
  if (error) return error;

  try {
    const body = brandConfigSchema.parse(await req.json());
    const data = {
      ...body,
      logoUrl: body.logoUrl || null,
      visualGuidelines: body.visualGuidelines || null,
      brandColors: body.brandColors ?? undefined,
      brandFonts: body.brandFonts ?? undefined,
      artTemplateSet: body.artTemplateSet ?? "carousel",
    };

    const existing = await prisma.instagramBrandConfig.findFirst({ orderBy: { createdAt: "asc" } });

    const brand = existing
      ? await prisma.instagramBrandConfig.update({ where: { id: existing.id }, data, include: { personas: true } })
      : await prisma.instagramBrandConfig.create({ data, include: { personas: true } });

    return NextResponse.json(sanitizeBrandForClient(brand));
  } catch (e) {
    if (e instanceof z.ZodError) {
      const first = e.errors[0];
      const field = first.path.length ? `${String(first.path[0])}: ` : "";
      return NextResponse.json({ error: `${field}${first.message}` }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao salvar configuração da marca" }, { status: 500 });
  }
}
