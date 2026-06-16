import { folderToCategory } from "./config";
import { listDriveImagesRecursive } from "./google-api";
import { indexLocalDriveFolder } from "./local-index";
import { prisma } from "@/lib/prisma";

export type SyncResult = {
  mode: "google_drive" | "local_dev";
  created: number;
  updated: number;
  total: number;
  message: string;
};

async function upsertCatalogEntry(
  brandId: string,
  data: {
    sourceProvider: string;
    driveFileId?: string | null;
    localPath?: string | null;
    filename: string;
    mimeType: string;
    driveFolderPath: string;
    category: ReturnType<typeof folderToCategory>;
    url: string;
    thumbnailUrl?: string | null;
    webViewLink?: string | null;
    webContentLink?: string | null;
    tags: string[];
  }
) {
  const where =
    data.driveFileId != null
      ? { brandConfigId: brandId, driveFileId: data.driveFileId }
      : data.localPath != null
        ? { brandConfigId: brandId, localPath: data.localPath }
        : null;

  if (!where) return { created: false };

  const existing = await prisma.instagramImage.findFirst({ where });

  const payload = {
    brandConfigId: brandId,
    sourceProvider: data.sourceProvider,
    driveFileId: data.driveFileId ?? null,
    localPath: data.localPath ?? null,
    filename: data.filename,
    mimeType: data.mimeType,
    driveFolderPath: data.driveFolderPath,
    category: data.category,
    url: data.url,
    thumbnailUrl: data.thumbnailUrl ?? null,
    webViewLink: data.webViewLink ?? null,
    webContentLink: data.webContentLink ?? null,
    description: `${data.filename} — ${data.driveFolderPath}`,
    tags: data.tags,
    status: "AVAILABLE" as const,
    imageType: "REAL" as const,
    isRealPhoto: true,
    isGenerated: false,
    isConcept: false,
    metaPublishReady: false,
    metaPublishUrl: null,
  };

  if (existing) {
    await prisma.instagramImage.update({ where: { id: existing.id }, data: payload });
    return { created: false };
  }

  await prisma.instagramImage.create({ data: payload });
  return { created: true };
}

export async function syncGoogleDriveCatalog(brandId: string, folderId: string): Promise<SyncResult> {
  const files = await listDriveImagesRecursive(folderId);
  let created = 0;
  let updated = 0;

  for (const file of files) {
    const folderName = file.driveFolderPath.split("/").pop() ?? file.driveFolderPath;
    const result = await upsertCatalogEntry(brandId, {
      sourceProvider: "google_drive",
      driveFileId: file.driveFileId,
      filename: file.filename,
      mimeType: file.mimeType,
      driveFolderPath: file.driveFolderPath,
      category: folderToCategory(folderName),
      url: file.previewUrl,
      thumbnailUrl: file.thumbnailUrl,
      webViewLink: file.webViewLink,
      webContentLink: file.webContentLink,
      tags: ["google_drive", folderName.toLowerCase()],
    });
    if (result.created) created++;
    else updated++;
  }

  await prisma.instagramBrandConfig.update({
    where: { id: brandId },
    data: {
      googleDriveFolderId: folderId,
      googleDriveLastSyncAt: new Date(),
      googleDriveLastSyncError: null,
      googleDriveSyncCount: files.length,
    },
  });

  return {
    mode: "google_drive",
    created,
    updated,
    total: files.length,
    message: `Sincronizado: ${created} nova(s), ${updated} atualizada(s), ${files.length} no total.`,
  };
}

export async function syncLocalDriveCatalog(brandId: string, localPath: string, siteUrl: string): Promise<SyncResult> {
  const files = await indexLocalDriveFolder(localPath, siteUrl.replace(/\/$/, ""));
  let created = 0;
  let updated = 0;

  for (const file of files) {
    const folderName = file.driveFolderPath.split("/").pop() ?? file.driveFolderPath;
    const result = await upsertCatalogEntry(brandId, {
      sourceProvider: "local_dev",
      localPath: file.localPath,
      filename: file.filename,
      mimeType: file.mimeType,
      driveFolderPath: file.driveFolderPath,
      category: file.category ?? folderToCategory(folderName),
      url: file.previewUrl,
      tags: ["local_dev", folderName.toLowerCase()],
    });
    if (result.created) created++;
    else updated++;
  }

  await prisma.instagramBrandConfig.update({
    where: { id: brandId },
    data: {
      googleDriveLocalPath: localPath,
      googleDriveLastSyncAt: new Date(),
      googleDriveLastSyncError: null,
      googleDriveSyncCount: files.length,
    },
  });

  return {
    mode: "local_dev",
    created,
    updated,
    total: files.length,
    message: `Indexado localmente: ${created} nova(s), ${updated} atualizada(s), ${files.length} no total.`,
  };
}
