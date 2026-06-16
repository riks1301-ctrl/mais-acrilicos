import { requireAdminSession } from "@/lib/instagram/auth";
import { normalizeExternalImageUrl } from "@/lib/instagram/images/drive";
import { externalImagesSchema } from "@/lib/instagram/images/schemas";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function POST(req: Request) {
  const { error } = await requireAdminSession();
  if (error) return error;

  try {
    const brand = await prisma.instagramBrandConfig.findFirst({ orderBy: { createdAt: "asc" } });
    if (!brand) {
      return NextResponse.json({ error: "Configure a marca antes de importar imagens." }, { status: 400 });
    }

    const body = await req.json();
    const input = externalImagesSchema.parse(body);
    const created: { id: string; url: string }[] = [];
    const skipped: string[] = [];

    for (const raw of input.urls) {
      const normalized = normalizeExternalImageUrl(raw);
      if (!normalized) {
        skipped.push(raw);
        continue;
      }

      const existing = await prisma.instagramImage.findFirst({
        where: { brandConfigId: brand.id, url: normalized.url },
      });
      if (existing) {
        skipped.push(raw);
        continue;
      }

      const driveTag = normalized.driveFileId ? "google_drive" : "external_url";
      const image = await prisma.instagramImage.create({
        data: {
          brandConfigId: brand.id,
          url: normalized.url,
          storageKey: normalized.driveFileId ? `gdrive:${normalized.driveFileId}` : null,
          status: input.status,
          imageType: input.imageType,
          category: input.category ?? null,
          description:
            input.description ??
            (normalized.driveFileId ? "Foto importada do Google Drive" : "Imagem externa"),
          tags: [...input.tags, driveTag],
          isRealPhoto: true,
          isGenerated: false,
          isConcept: false,
          usagePermission: "uso_interno",
        },
      });

      created.push({ id: image.id, url: image.url });
    }

    return NextResponse.json(
      {
        created,
        skippedCount: skipped.length,
        message:
          created.length > 0
            ? `${created.length} imagem(ns) importada(s) sem upload no servidor.`
            : "Nenhuma imagem nova importada.",
      },
      { status: 201 }
    );
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0].message }, { status: 400 });
    if (e instanceof Error) return NextResponse.json({ error: e.message }, { status: 500 });
    return NextResponse.json({ error: "Erro ao importar imagens" }, { status: 500 });
  }
}
