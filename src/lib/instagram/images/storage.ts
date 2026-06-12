import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { ALLOWED_MIME_TYPES, MAX_IMAGE_SIZE_BYTES, UPLOAD_PUBLIC_PREFIX } from "./constants";

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const MAX_PIXELS_ESTIMATE = 40_000_000;

function detectMimeFromBuffer(buffer: Buffer): string | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer.length >= 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return "image/png";
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

export function validateImageBuffer(buffer: Buffer, declaredMime: string): { ok: true; mime: string } | { ok: false; error: string } {
  if (buffer.length === 0) return { ok: false, error: "Arquivo vazio." };
  if (buffer.length > MAX_IMAGE_SIZE_BYTES) return { ok: false, error: "Arquivo muito grande. Máximo 10MB." };
  if (buffer.length > MAX_PIXELS_ESTIMATE) return { ok: false, error: "Imagem muito grande para processar com segurança." };

  const detected = detectMimeFromBuffer(buffer);
  if (!detected) return { ok: false, error: "Formato não reconhecido. Envie JPEG, PNG ou WebP válido." };
  if (!ALLOWED_MIME_TYPES.includes(detected as (typeof ALLOWED_MIME_TYPES)[number])) {
    return { ok: false, error: "Formato não permitido." };
  }
  if (declaredMime && declaredMime !== detected) {
    return { ok: false, error: "Tipo declarado não corresponde ao conteúdo real do arquivo." };
  }
  return { ok: true, mime: detected };
}

export function validateImageFile(file: File): { ok: true } | { ok: false; error: string } {
  if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
    return { ok: false, error: "Formato inválido. Use JPEG, PNG ou WebP." };
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return { ok: false, error: "Arquivo muito grande. Máximo 10MB." };
  }
  if (file.size === 0) {
    return { ok: false, error: "Arquivo vazio." };
  }
  return { ok: true };
}

export async function saveImageBuffer(
  buffer: Buffer,
  mime: string,
  filenamePrefix: string
): Promise<{
  storageKey: string;
  publicUrl: string;
  mimeType: string;
  fileSize: number;
  filename: string;
}> {
  const validated = validateImageBuffer(buffer, mime);
  if (!validated.ok) throw new Error(validated.error);

  const ext = EXT_BY_MIME[validated.mime] ?? ".png";
  const id = randomUUID();
  const storageKey = `${id}${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "instagram");
  const safeName = filenamePrefix.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);

  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, storageKey), buffer);

  return {
    storageKey,
    publicUrl: `${UPLOAD_PUBLIC_PREFIX}/${storageKey}`,
    mimeType: validated.mime,
    fileSize: buffer.length,
    filename: `${safeName}${ext}`,
  };
}

export function resolveStoragePath(storageKey: string): string {
  return path.join(process.cwd(), "public", "uploads", "instagram", storageKey);
}

export async function saveImageFile(file: File): Promise<{
  storageKey: string;
  publicUrl: string;
  mimeType: string;
  fileSize: number;
  filename: string;
}> {
  const pre = validateImageFile(file);
  if (!pre.ok) throw new Error(pre.error);

  const buffer = Buffer.from(await file.arrayBuffer());
  const validated = validateImageBuffer(buffer, file.type);
  if (!validated.ok) throw new Error(validated.error);

  const ext = EXT_BY_MIME[validated.mime] ?? ".jpg";
  const id = randomUUID();
  const storageKey = `${id}${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "instagram");

  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, storageKey), buffer);

  return {
    storageKey,
    publicUrl: `${UPLOAD_PUBLIC_PREFIX}/${storageKey}`,
    mimeType: validated.mime,
    fileSize: buffer.length,
    filename: file.name.replace(/[^a-zA-Z0-9._-]/g, "_"),
  };
}
