import type { InstagramImage } from "@prisma/client";
import {
  canUseVercelBlob,
  instagramBlobPathname,
  isPrivateBlobUrl,
  loadStorageBuffer,
  metaImageBlobPathname,
  putInstagramBlob,
  readBlobBuffer,
} from "@/lib/instagram/images/blob";
import { googleDriveDirectUrl } from "@/lib/instagram/images/drive";
import { fetchImageBuffer } from "@/lib/instagram/images/fetch-buffer";
import { publicMediaUrl } from "@/lib/instagram/images/media-token";
import { saveImageBuffer } from "@/lib/instagram/images/storage";
import { prisma } from "@/lib/prisma";
import { readFile } from "fs/promises";
import { downloadDriveFile } from "./google-api";
import { isPathInsideRoot } from "./local-index";

export type MetaUrlCheck = {
  ok: boolean;
  url: string | null;
  reason: string;
};

export function checkMetaImageUrl(url: string | null | undefined): MetaUrlCheck {
  if (!url) return { ok: false, url: null, reason: "URL ausente." };
  if (!url.startsWith("https://")) return { ok: false, url, reason: "A Meta exige URL HTTPS pública." };
  if (url.includes("/api/admin/")) {
    return { ok: false, url, reason: "URL administrativa (exige login) — não serve para a Meta." };
  }
  if (url.includes("/api/instagram/media/") || url.includes(".blob.vercel-storage.com")) {
    return { ok: true, url, reason: "URL pública para publicação na Meta." };
  }
  if (url.includes("drive.google.com") && !url.includes("uc?export=") && !url.includes("blob.vercel-storage.com")) {
    return { ok: false, url, reason: "Link do Drive precisa ser público ou use cópia temporária na publicação." };
  }
  if (isPrivateBlobUrl(url)) {
    return { ok: false, url, reason: "Blob privado — gere URL de publicação antes de enviar à Meta." };
  }
  return { ok: true, url, reason: "URL HTTPS válida para tentativa de publicação." };
}

function detectImageMime(buffer: Buffer): string | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer.length >= 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return "image/png";
  }
  if (buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") {
    return "image/webp";
  }
  return null;
}

async function toMetaJpeg(buffer: Buffer): Promise<Buffer> {
  if (detectImageMime(buffer) === "image/jpeg") return buffer;
  const sharp = (await import("sharp")).default;
  return sharp(buffer).jpeg({ quality: 92 }).toBuffer();
}

async function loadImageBytes(image: InstagramImage): Promise<Buffer> {
  const metaCopy = await readBlobBuffer(metaImageBlobPathname(image.id));
  if (metaCopy) return metaCopy;

  if (image.storageKey && canUseVercelBlob()) {
    return loadStorageBuffer(image.storageKey);
  }

  if (image.sourceProvider === "local_dev" && image.localPath) {
    const root = process.env.GOOGLE_DRIVE_LOCAL_PATH;
    if (!root || !isPathInsideRoot(image.localPath, root)) {
      throw new Error("Caminho local inválido para leitura da imagem.");
    }
    return readFile(image.localPath);
  }

  if (image.sourceProvider === "google_drive" && image.driveFileId) {
    return downloadDriveFile(image.driveFileId);
  }

  const buf = await fetchImageBuffer(image.url);
  if (!buf) throw new Error("Não foi possível baixar a imagem da URL configurada.");
  return buf;
}

async function verifyImageUrlForMeta(url: string): Promise<void> {
  const res = await fetch(url, { headers: { Accept: "image/*" }, redirect: "follow" });
  if (!res.ok) {
    throw new Error(`A Meta não consegue acessar a imagem (HTTP ${res.status}). Reenvie o upload ou tente de novo.`);
  }
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json") || contentType.includes("text/html")) {
    throw new Error("A URL da imagem retorna página/erro em vez de arquivo de imagem.");
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const mime = detectImageMime(buf);
  if (!mime || mime === "image/webp") {
    throw new Error("A URL da imagem não retorna JPEG/PNG válido para o Instagram.");
  }
}

async function uploadMetaJpeg(imageId: string, jpeg: Buffer): Promise<string> {
  const pathname = metaImageBlobPathname(imageId);
  const blob = await putInstagramBlob(pathname, jpeg, "image/jpeg");
  if (!isPrivateBlobUrl(blob.url)) return blob.url;
  return publicMediaUrl(imageId);
}

/** Garante URL HTTPS pública (JPEG) para Meta — copia para Blob na publicação. */
export async function ensureMetaPublishUrl(imageId: string): Promise<string> {
  const image = await prisma.instagramImage.findUnique({ where: { id: imageId } });
  if (!image) throw new Error("Imagem não encontrada.");

  if (image.metaPublishUrl && !checkMetaImageUrl(image.metaPublishUrl).ok) {
    await prisma.instagramImage.update({
      where: { id: imageId },
      data: { metaPublishUrl: null, metaPublishReady: false },
    });
  }

  const raw = await loadImageBytes(image);
  const jpeg = await toMetaJpeg(raw);

  if (canUseVercelBlob()) {
    const publishUrl = await uploadMetaJpeg(imageId, jpeg);
    await verifyImageUrlForMeta(publishUrl);
    await prisma.instagramImage.update({
      where: { id: imageId },
      data: { metaPublishUrl: publishUrl, metaPublishReady: true, mimeType: "image/jpeg" },
    });
    return publishUrl;
  }

  const saved = await saveImageBuffer(jpeg, "image/jpeg", `meta-publish-${imageId}`);
  const publishUrl = saved.publicUrl.startsWith("http")
    ? saved.publicUrl
    : `${process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000"}${saved.publicUrl}`;

  await prisma.instagramImage.update({
    where: { id: imageId },
    data: {
      url: saved.publicUrl,
      storageKey: saved.storageKey,
      metaPublishUrl: publishUrl,
      metaPublishReady: true,
      mimeType: "image/jpeg",
    },
  });

  return publishUrl;
}

export function resolvePreviewUrl(
  image: Pick<InstagramImage, "url" | "thumbnailUrl" | "webContentLink" | "driveFileId">
): string {
  if (image.thumbnailUrl) return image.thumbnailUrl;
  if (image.webContentLink) return image.webContentLink;
  if (image.driveFileId) return googleDriveDirectUrl(image.driveFileId);
  return image.url;
}
