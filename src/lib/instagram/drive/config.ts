import type { IgImageCategory } from "@prisma/client";

export const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".heic"]);

export const FOLDER_TO_CATEGORY: Record<string, IgImageCategory> = {
  obras: "OBRA_PRONTA",
  "obra pronta": "OBRA_PRONTA",
  "obras prontas": "OBRA_PRONTA",
  bastidores: "BASTIDORES",
  acrilico: "ACRILICO",
  acrilicos: "ACRILICO",
  display: "DISPLAY",
  displays: "DISPLAY",
  fachada: "FACHADA",
  fachadas: "FACHADA",
  banner: "BANNER",
  banners: "BANNER",
  adesivo: "ADESIVO",
  adesivos: "ADESIVO",
  luminoso: "LUMINOSO",
  luminosos: "LUMINOSO",
  pdv: "PDV",
  "antes depois": "ANTES_DEPOIS",
  "antes/depois": "ANTES_DEPOIS",
};

export function folderToCategory(folderName: string): IgImageCategory | null {
  const key = folderName.trim().toLowerCase();
  return FOLDER_TO_CATEGORY[key] ?? null;
}

export function getDriveConfig() {
  return {
    folderId: process.env.GOOGLE_DRIVE_FOLDER_ID ?? null,
    localPath: process.env.GOOGLE_DRIVE_LOCAL_PATH ?? null,
    hasServiceAccount: !!(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY),
    hasServiceAccountJson: !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
  };
}

export function isDriveApiConfigured(): boolean {
  const c = getDriveConfig();
  return !!(c.folderId && (c.hasServiceAccount || c.hasServiceAccountJson));
}

export function isLocalDriveConfigured(): boolean {
  return !!getDriveConfig().localPath;
}
