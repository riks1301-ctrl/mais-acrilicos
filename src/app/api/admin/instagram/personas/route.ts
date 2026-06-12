import { requireAdminSession } from "@/lib/instagram/auth";
import { personaSchema } from "@/lib/instagram/schemas";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function POST(req: Request) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const brand = await prisma.instagramBrandConfig.findFirst({ orderBy: { createdAt: "asc" } });
  if (!brand) return NextResponse.json({ error: "Configure a marca antes de adicionar personas" }, { status: 400 });

  try {
    const data = personaSchema.parse(await req.json());
    const persona = await prisma.instagramPersona.create({ data: { ...data, brandConfigId: brand.id } });
    return NextResponse.json(persona, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0].message }, { status: 400 });
    return NextResponse.json({ error: "Erro ao criar persona" }, { status: 500 });
  }
}
