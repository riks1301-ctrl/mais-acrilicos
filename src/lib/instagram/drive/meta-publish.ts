import type { InstagramImage } from "@prisma/client";
import { canUseVercelBlob, instagramBlobPathname, isPrivateBlobUrl, putInstagramBlob, readBlobBuffer } from "@/lib/instagram/images/blob";
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
  if (url.includes("/api/instagram/media/")) {
    return { ok: true, url, reason: "URL pública assinada para publicação na Meta." };
  }
  if (url.includes("drive.google.com") && !url.includes("uc?export=") && !url.includes("blob.vercel-storage.com")) {
    return { ok: false, url, reason: "Link do Drive precisa ser público ou use cópia temporária na publicação." };
  }
  if (isPrivateBlobUrl(url)) {
    return { ok: false, url, reason: "Blob privado — gere URL de publicação antes de enviar à Meta." };
  }
  return { ok: true, url, reason: "URL HTTPS válida para tentativa de publicação." };
}

async function loadImageBytes(image: InstagramImage): Promise<Buffer> {
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

async function verifyImageUrlForMeta(url: string): Promise<void> {
  const res = await fetch(url, { headers: { Accept: "image/*" }, redirect: "follow" });
  if (!res.ok) {
    throw new Error(`A Meta não consegue acessar a imagem (HTTP ${res.status}). Reenvie o upload ou tente de novo.`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (!detectImageMime(buf)) {
    throw new Error("A URL da imagem não retorna um arquivo JPEG/PNG/WebP válido para o Instagram.");
  }
}

/** Garante URL HTTPS pública para Meta — copia para Blob somente na publicação. */
export async function ensureMetaPublishUrl(imageId: string): Promise<string> {
  const image = await prisma.instagramImage.findUnique({ where: { id: imageId } });
  if (!image) throw new Error("Imagem não encontrada.");

  if (image.metaPublishUrl && !checkMetaImageUrl(image.metaPublishUrl).ok) {
    await prisma.instagramImage.update({
      where: { id: imageId },
      data: { metaPublishUrl: null, metaPublishReady: false },
    });
  }

  if (image.storageKey && canUseVercelBlob()) {
    const buffer = await loadStorageBuffer(image.storageKey);
    const mime = detectImageMime(buffer) ?? image.mimeType ?? "image/jpeg";
    const pathname = instagramBlobPathname(image.storageKey);
    const inBlob = await readBlobBuffer(pathname);
    if (!inBlob) {
      await putInstagramBlob(pathname, buffer, mime);
    }

    const signed = await publicMediaUrl(imageId);
    await verifyImageUrlForMeta(signed);
    await prisma.instagramImage.update({
      where: { id: imageId },
      data: { metaPublishUrl: signed, metaPublishReady: true, mimeType: mime },
    });
    return signed;
  }

  if (image.metaPublishUrl && image.metaPublishReady && checkMetaImageUrl(image.metaPublishUrl).ok) {
    await verifyImageUrlForMeta(image.metaPublishUrl);
    return image.metaPublishUrl;
  }

  const directCheck = checkMetaImageUrl(image.url);
  if (directCheck.ok && image.sourceProvider === "upload" && !isPrivateBlobUrl(image.url)) {
    await prisma.instagramImage.update({
      where: { id: imageId },
      data: { metaPublishUrl: image.url, metaPublishReady: true },
    });
    return image.url;
  }

  const buffer = await loadImageBytes(image);
  const mime = image.mimeType ?? "image/jpeg";
  const saved = await saveImageBuffer(buffer, mime, `meta-publish-${imageId}`);
  const publishUrl = canUseVercelBlob() ? await publicMediaUrl(imageId) : saved.publicUrl;
  if (canUseVercelBlob()) await verifyImageUrlForMeta(publishUrl);

  await prisma.instagramImage.update({
    where: { id: imageId },
    data: {
      url: saved.publicUrl,
      storageKey: saved.storageKey,
      metaPublishUrl: publishUrl,
      metaPublishReady: true,
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
