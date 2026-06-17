import { get, put, type PutBlobResult } from "@vercel/blob";
import { readFile } from "fs/promises";
import path from "path";

export const BLOB_INSTAGRAM_PREFIX = "instagram";

export function canUseVercelBlob(): boolean {
  if (process.env.BLOB_READ_WRITE_TOKEN) return true;
  if (process.env.VERCEL && process.env.BLOB_STORE_ID) return true;
  return false;
}

/** Vercel/serverless não permite gravar em public/uploads. */
export function isReadOnlyServerRuntime(): boolean {
  if (process.env.VERCEL === "1" || process.env.VERCEL === "true") return true;
  if (process.cwd().startsWith("/var/task")) return true;
  if (process.env.AWS_LAMBDA_FUNCTION_NAME) return true;
  return false;
}

export function shouldUseBlobStorage(): boolean {
  return canUseVercelBlob() || isReadOnlyServerRuntime();
}

export function blobAccessMode(): "public" | "private" {
  const configured = process.env.BLOB_ACCESS?.toLowerCase();
  if (configured === "public" || configured === "private") return configured;
  return "private";
}

export function instagramBlobPathname(storageKey: string): string {
  return `${BLOB_INSTAGRAM_PREFIX}/${storageKey}`;
}

export function isPrivateBlobUrl(url: string): boolean {
  return url.includes(".private.blob.vercel-storage.com");
}

export function resolveSiteUrl(): string {
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (site && !site.includes("localhost")) return site.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (site) return site.replace(/\/$/, "");
  return "http://localhost:3000";
}

/** Domínio HTTPS que crawlers externos (Meta) conseguem alcançar. */
export function resolvePublicSiteUrl(): string {
  const prod = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (prod) return prod.startsWith("http") ? prod.replace(/\/$/, "") : `https://${prod}`;
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel}`;
  return resolveSiteUrl();
}

export function metaImageBlobPathname(imageId: string): string {
  return `${BLOB_INSTAGRAM_PREFIX}/meta/${imageId}.jpg`;
}

export function adminBlobMediaUrl(storageKey: string): string {
  return `${resolveSiteUrl()}/api/admin/instagram/media/blob?key=${encodeURIComponent(storageKey)}`;
}

function blobStoreOptions() {
  return process.env.BLOB_STORE_ID ? { storeId: process.env.BLOB_STORE_ID } : {};
}

async function streamToBuffer(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  return Buffer.concat(chunks);
}

export async function readBlobBuffer(pathname: string, access?: "public" | "private"): Promise<Buffer | null> {
  const modes: Array<"public" | "private"> = access ? [access] : ["private", "public"];
  for (const mode of modes) {
    const result = await get(pathname, { access: mode, ...blobStoreOptions() });
    if (result?.statusCode === 200 && result.stream) {
      return streamToBuffer(result.stream);
    }
  }
  return null;
}

export async function loadStorageBuffer(storageKey: string): Promise<Buffer> {
  const localPath = path.join(process.cwd(), "public", "uploads", "instagram", storageKey);
  try {
    return await readFile(localPath);
  } catch {
    /* local miss */
  }

  if (canUseVercelBlob()) {
    const fromBlob = await readBlobBuffer(instagramBlobPathname(storageKey));
    if (fromBlob) return fromBlob;
  }

  throw new Error(`Imagem não encontrada: ${storageKey}`);
}

export async function putInstagramBlob(
  pathname: string,
  buffer: Buffer,
  contentType: string
): Promise<PutBlobResult & { accessUsed: "public" | "private" }> {
  const modes: Array<"public" | "private"> =
    blobAccessMode() === "private" ? ["private", "public"] : ["public", "private"];

  let lastError: unknown;
  for (const access of modes) {
    try {
      const blob = await put(pathname, buffer, {
        access,
        contentType,
        addRandomSuffix: false,
        ...blobStoreOptions(),
      });
      return { ...blob, accessUsed: access };
    } catch (e) {
      lastError = e;
      const msg = e instanceof Error ? e.message : String(e);
      const mismatch =
        msg.includes("Cannot use public access on a private store") ||
        msg.includes("Cannot use private access on a public store");
      if (!mismatch) throw e;
    }
  }

  const detail = lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(`Falha ao gravar no Vercel Blob: ${detail}`);
}

export function resolveStoredImageUrl(storageKey: string, blobUrl: string): string {
  if (isPrivateBlobUrl(blobUrl) || blobAccessMode() === "private") {
    return adminBlobMediaUrl(storageKey);
  }
  return blobUrl;
}
