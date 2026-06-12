import { requireAdminSession } from "@/lib/instagram/auth";
import { personaSchema } from "@/lib/instagram/schemas";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdminSession();
  if (error) return error;

  try {
    const brand = await prisma.instagramBrandConfig.findFirst({ orderBy: { createdAt: "asc" } });
    const existing = await prisma.instagramPersona.findFirst({
      where: { id: params.id, ...(brand ? { brandConfigId: brand.id } : {}) },
    });
    if (!existing) return NextResponse.json({ error: "Persona não encontrada" }, { status: 404 });

    const data = personaSchema.parse(await req.json());
    const persona = await prisma.instagramPersona.update({ where: { id: existing.id }, data });
    return NextResponse.json(persona);
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0].message }, { status: 400 });
    return NextResponse.json({ error: "Erro ao atualizar persona" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const brand = await prisma.instagramBrandConfig.findFirst({ orderBy: { createdAt: "asc" } });
  const existing = await prisma.instagramPersona.findFirst({
    where: { id: params.id, ...(brand ? { brandConfigId: brand.id } : {}) },
  });
  if (!existing) return NextResponse.json({ error: "Persona não encontrada" }, { status: 404 });

  await prisma.instagramPersona.delete({ where: { id: existing.id } });
  return NextResponse.json({ ok: true });
}
