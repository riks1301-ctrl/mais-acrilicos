import { access } from "fs/promises";
import type { IgImageCategory } from "@prisma/client";
import { folderToCategory } from "./classify";

export { folderToCategory, KNOWN_CLIENTS } from "./classify";

/** Extensões aceitas na indexação local (somente leitura). */
export const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);

export function getLocalDriveRoot(): string | null {
  return process.env.LOCAL_DRIVE_ROOT?.trim() || process.env.GOOGLE_DRIVE_LOCAL_PATH?.trim() || null;
}

export async function isLocalDriveAvailable(): Promise<boolean> {
  const root = getLocalDriveRoot();
  if (!root) return false;
  try {
    await access(root);
    return true;
  } catch {
    return false;
  }
}

export function getDriveConfig() {
  const localPath = getLocalDriveRoot();
  return {
    folderId: process.env.GOOGLE_DRIVE_FOLDER_ID ?? null,
    localPath,
    localDriveRoot: localPath,
    readOnly: true,
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

/** Em produção na Vercel, ocultar UI local se a pasta não existir no servidor. */
export async function shouldShowLocalDriveUi(): Promise<boolean> {
  if (process.env.VERCEL && !(await isLocalDriveAvailable())) return false;
  return isLocalDriveConfigured() || (await isLocalDriveAvailable());
}

export function folderToCategoryLegacy(folderName: string): IgImageCategory | null {
  return folderToCategory(folderName);
}
