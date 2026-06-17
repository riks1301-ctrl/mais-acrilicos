import { instagramBlobPathname, loadStorageBuffer, readBlobBuffer } from "@/lib/instagram/images/blob";
import { verifyPublicMediaToken } from "@/lib/instagram/images/media-token";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** URL pública assinada para a Meta buscar imagens do Blob privado. */
export async function GET(req: Request, { params }: { params: { imageId: string } }) {
  const token = new URL(req.url).searchParams.get("t");
  if (!token || !(await verifyPublicMediaToken(params.imageId, token))) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const image = await prisma.instagramImage.findUnique({ where: { id: params.imageId } });
  if (!image?.storageKey) {
    return NextResponse.json({ error: "Imagem não encontrada" }, { status: 404 });
  }

  const buffer = (await readBlobBuffer(instagramBlobPathname(image.storageKey))) ?? (await loadStorageBuffer(image.storageKey));
  const mime =
    (buffer[0] === 0xff && buffer[1] === 0xd8 ? "image/jpeg" : null) ??
    (buffer[0] === 0x89 ? "image/png" : null) ??
    image.mimeType ??
    "image/jpeg";

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": mime,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
