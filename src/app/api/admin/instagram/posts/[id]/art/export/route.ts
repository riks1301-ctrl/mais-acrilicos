import { exportArtSchema } from "@/lib/instagram/art/schemas";
import { requireAdminSession } from "@/lib/instagram/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdminSession();
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const { format } = exportArtSchema.parse({ format: searchParams.get("format") ?? "zip" });
    const slideOrder = searchParams.get("slide") ? Number(searchParams.get("slide")) : null;

    const arts = await prisma.instagramPostImage.findMany({
      where: { postId: params.id, role: { in: ["cover", "slide", "art"] } },
      include: { image: true },
      orderBy: { order: "asc" },
    });

    if (!arts.length) {
      return NextResponse.json({ error: "Nenhuma arte gerada. Use Gerar arte completa primeiro." }, { status: 404 });
    }

    const { exportArtAsJpgZip, exportArtAsPdf, exportArtAsZip, exportSingleFile } = await import(
      "@/lib/instagram/art/export"
    );

    const files = arts
      .filter((a) => a.image.storageKey)
      .map((a) => ({
        storageKey: a.image.storageKey!,
        order: a.order,
        role: a.role,
        filename: a.image.filename ?? `slide-${a.order}.png`,
      }));

    if (slideOrder !== null && !Number.isNaN(slideOrder)) {
      const one = files.find((f) => f.order === slideOrder) ?? files[0];
      const out = await exportSingleFile(one.storageKey, format === "jpg" ? "jpg" : "png");
      return new NextResponse(new Uint8Array(out.buffer), {
        headers: {
          "Content-Type": out.mime,
          "Content-Disposition": `attachment; filename="arte-slide-${one.order}${out.ext}"`,
        },
      });
    }

    if (format === "pdf") {
      const buffer = await exportArtAsPdf(files);
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="carrossel-${params.id}.pdf"`,
        },
      });
    }

    if (format === "jpg") {
      const buffer = await exportArtAsJpgZip(files);
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="carrossel-${params.id}-jpg.zip"`,
        },
      });
    }

    const buffer = await exportArtAsZip(files);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="carrossel-${params.id}-png.zip"`,
      },
    });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0].message }, { status: 400 });
    if (e instanceof Error) return NextResponse.json({ error: e.message }, { status: 500 });
    return NextResponse.json({ error: "Erro ao exportar arte" }, { status: 500 });
  }
}
