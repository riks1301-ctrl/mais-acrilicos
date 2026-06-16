import type { IgImageCategory } from "@prisma/client";
import { detectCategoryFromPath, detectClientFromPath, themesFromPostText } from "./classify";
import { folderToCategory } from "./config";
import { listDriveImagesRecursive } from "./google-api";
import { indexLocalDriveBatched } from "./local-index";
import { prisma } from "@/lib/prisma";

export type SyncResult = {
  mode: "google_drive" | "local_dev";
  created: number;
  updated: number;
  skipped: number;
  archived: number;
  total: number;
  message: string;
  categories: Record<string, number>;
  clients: Record<string, number>;
  errors: string[];
};

type CatalogInput = {
  sourceProvider: string;
  driveFileId?: string | null;
  localPath?: string | null;
  filename: string;
  mimeType: string;
  fileSize?: number | null;
  driveFolderPath: string;
  driveRelativePath?: string | null;
  driveMainFolder?: string | null;
  driveSubfolder?: string | null;
  clientName?: string | null;
  fileHash?: string | null;
  fileCreatedAt?: Date | null;
  fileModifiedAt?: Date | null;
  category: IgImageCategory | null;
  url: string;
  thumbnailUrl?: string | null;
  webViewLink?: string | null;
  webContentLink?: string | null;
  tags: string[];
};

function bumpCount(map: Record<string, number>, key: string | null | undefined) {
  if (!key) return;
  map[key] = (map[key] ?? 0) + 1;
}

async function upsertCatalogEntry(
  brandId: string,
  data: CatalogInput
): Promise<"created" | "updated" | "skipped"> {
  const where =
    data.driveFileId != null
      ? { brandConfigId: brandId, driveFileId: data.driveFileId }
      : data.localPath != null
        ? { brandConfigId: brandId, localPath: data.localPath }
        : null;

  if (!where) return "skipped";

  const existing = await prisma.instagramImage.findFirst({ where });

  if (existing && data.fileHash && existing.fileHash === data.fileHash && existing.status === "AVAILABLE") {
    return "skipped";
  }

  const payload = {
    brandConfigId: brandId,
    sourceProvider: data.sourceProvider,
    driveFileId: data.driveFileId ?? null,
    localPath: data.localPath ?? null,
    filename: data.filename,
    mimeType: data.mimeType,
    fileSize: data.fileSize ?? null,
    driveFolderPath: data.driveFolderPath,
    driveRelativePath: data.driveRelativePath ?? null,
    driveMainFolder: data.driveMainFolder ?? null,
    driveSubfolder: data.driveSubfolder ?? null,
    clientName: data.clientName ?? null,
    fileHash: data.fileHash ?? null,
    fileCreatedAt: data.fileCreatedAt ?? null,
    fileModifiedAt: data.fileModifiedAt ?? null,
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
    return "updated";
  }

  await prisma.instagramImage.create({ data: payload });
  return "created";
}

async function archiveStaleLocalImages(brandId: string, activePaths: Set<string>): Promise<number> {
  const stale = await prisma.instagramImage.findMany({
    where: {
      brandConfigId: brandId,
      sourceProvider: "local_dev",
      status: "AVAILABLE",
      localPath: { not: null },
    },
    select: { id: true, localPath: true },
  });

  const toArchive = stale.filter((img) => img.localPath && !activePaths.has(img.localPath));
  if (!toArchive.length) return 0;

  await prisma.instagramImage.updateMany({
    where: { id: { in: toArchive.map((i) => i.id) } },
    data: { status: "ARCHIVED" },
  });

  return toArchive.length;
}

export async function syncGoogleDriveCatalog(brandId: string, folderId: string): Promise<SyncResult> {
  const files = await listDriveImagesRecursive(folderId);
  let created = 0;
  let updated = 0;
  let skipped = 0;
  const categories: Record<string, number> = {};
  const clients: Record<string, number> = {};
  const errors: string[] = [];
  const activeIds = new Set<string>();

  for (const file of files) {
    try {
      activeIds.add(file.driveFileId);
      const category =
        detectCategoryFromPath(file.driveFolderPath, file.filename) ??
        folderToCategory(file.driveFolderPath.split("/").pop() ?? "");
      const clientName = detectClientFromPath(file.driveFolderPath, file.filename);
      bumpCount(categories, category);
      bumpCount(clients, clientName);

      const result = await upsertCatalogEntry(brandId, {
        sourceProvider: "google_drive",
        driveFileId: file.driveFileId,
        filename: file.filename,
        mimeType: file.mimeType,
        driveFolderPath: file.driveFolderPath,
        driveRelativePath: file.driveFolderPath,
        category,
        clientName,
        url: file.previewUrl,
        thumbnailUrl: file.thumbnailUrl,
        webViewLink: file.webViewLink,
        webContentLink: file.webContentLink,
        tags: ["google_drive", ...(category ? [category.toLowerCase()] : []), ...(clientName ? [clientName.toLowerCase()] : [])],
      });
      if (result === "created") created++;
      else if (result === "updated") updated++;
      else skipped++;
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
    }
  }

  await prisma.instagramBrandConfig.update({
    where: { id: brandId },
    data: {
      googleDriveFolderId: folderId,
      googleDriveLastSyncAt: new Date(),
      googleDriveLastSyncError: errors[0] ?? null,
      googleDriveSyncCount: files.length,
    },
  });

  return {
    mode: "google_drive",
    created,
    updated,
    skipped,
    archived: 0,
    total: files.length,
    categories,
    clients,
    errors,
    message: `Sincronizado: ${created} nova(s), ${updated} atualizada(s), ${skipped} sem alteração, ${files.length} no total.`,
  };
}

export async function syncLocalDriveCatalog(brandId: string, localPath: string, siteUrl: string): Promise<SyncResult> {
  const apiBase = siteUrl.replace(/\/$/, "");
  let created = 0;
  let updated = 0;
  let skipped = 0;
  const categories: Record<string, number> = {};
  const clients: Record<string, number> = {};
  const errors: string[] = [];
  const activePaths = new Set<string>();
  let total = 0;

  for await (const batch of indexLocalDriveBatched(localPath, apiBase)) {
    for (const file of batch) {
      try {
        activePaths.add(file.localPath);
        total++;
        bumpCount(categories, file.category);
        bumpCount(clients, file.clientName);

        const result = await upsertCatalogEntry(brandId, {
          sourceProvider: "local_dev",
          localPath: file.localPath,
          filename: file.filename,
          mimeType: file.mimeType,
          fileSize: file.fileSize,
          driveFolderPath: file.driveFolderPath,
          driveRelativePath: file.relativePath,
          driveMainFolder: file.driveMainFolder,
          driveSubfolder: file.driveSubfolder,
          clientName: file.clientName,
          fileHash: file.fileHash,
          fileCreatedAt: file.fileCreatedAt,
          fileModifiedAt: file.fileModifiedAt,
          category: file.category,
          url: file.previewUrl,
          tags: [
            "local_dev",
            ...(file.category ? [file.category.toLowerCase()] : []),
            ...(file.clientName ? [file.clientName.toLowerCase()] : []),
          ],
        });
        if (result === "created") created++;
        else if (result === "updated") updated++;
        else skipped++;
      } catch (e) {
        errors.push(`${file.filename}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }

  const archived = await archiveStaleLocalImages(brandId, activePaths);

  await prisma.instagramBrandConfig.update({
    where: { id: brandId },
    data: {
      googleDriveLocalPath: localPath,
      googleDriveLastSyncAt: new Date(),
      googleDriveLastSyncError: errors[0] ?? null,
      googleDriveSyncCount: total,
    },
  });

  return {
    mode: "local_dev",
    created,
    updated,
    skipped,
    archived,
    total,
    categories,
    clients,
    errors,
    message: `Meu Drive indexado: ${created} nova(s), ${updated} atualizada(s), ${skipped} sem alteração, ${archived} arquivada(s), ${total} no total.`,
  };
}

export { themesFromPostText };
