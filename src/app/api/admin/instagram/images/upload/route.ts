import { requireAdminSession } from "@/lib/instagram/auth";
import { imageMetadataSchema } from "@/lib/instagram/images/schemas";
import { saveImageFile } from "@/lib/instagram/images/storage";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function POST(req: Request) {
  const { error } = await requireAdminSession();
  if (error) return error;

  try {
    const brand = await prisma.instagramBrandConfig.findFirst({ orderBy: { createdAt: "asc" } });
    if (!brand) {
      return NextResponse.json({ error: "Configure a marca antes de enviar imagens." }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Arquivo não enviado." }, { status: 400 });
    }

    const tagsRaw = formData.get("tags");
    const tags = tagsRaw ? String(tagsRaw).split(",").map((t) => t.trim()).filter(Boolean) : [];

    const serviceIdRaw = formData.get("serviceId");
    const serviceId = serviceIdRaw ? String(serviceIdRaw) : null;
    if (serviceId) {
      const svc = await prisma.instagramService.findUnique({ where: { id: serviceId } });
      if (!svc) return NextResponse.json({ error: "Serviço inválido." }, { status: 400 });
    }

    const meta = imageMetadataSchema.parse({
      category: formData.get("category"),
      description: formData.get("description"),
      tags,
      serviceId,
      clientProject: formData.get("clientProject") || null,
      usagePermission: formData.get("usagePermission") || "uso_interno",
      status: formData.get("status") || "IN_REVIEW",
      imageType: formData.get("imageType") || "REAL",
      altText: formData.get("altText") || null,
    });

    const saved = await saveImageFile(file);

    const image = await prisma.instagramImage.create({
      data: {
        brandConfigId: brand.id,
        ...meta,
        url: saved.publicUrl,
        storageKey: saved.storageKey,
        mimeType: saved.mimeType,
        fileSize: saved.fileSize,
        filename: saved.filename,
        isRealPhoto: meta.imageType === "REAL",
        isConcept: meta.imageType === "CONCEPT" || meta.imageType === "MOCKUP",
        isGenerated: meta.imageType === "COMMERCIAL_ART",
        altText: meta.altText ?? meta.description.slice(0, 120),
      },
      include: { service: true },
    });

    return NextResponse.json(image, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0].message }, { status: 400 });
    if (e instanceof Error) return NextResponse.json({ error: e.message }, { status: 400 });
    return NextResponse.json({ error: "Erro no upload" }, { status: 500 });
  }
}
