import { access, readdir, stat } from "fs/promises";
import { createHash } from "crypto";
import { createReadStream } from "fs";
import path from "path";
import type { IgImageCategory } from "@prisma/client";
import { detectCategoryFromPath, detectClientFromPath, splitDrivePath } from "./classify";

/** Somente leitura — o agente nunca apaga, renomeia ou move arquivos no Drive local. */
export const DRIVE_READ_ONLY = true;

export const LOCAL_IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);

const SKIP_NAMES = new Set(["thumbs.db", "desktop.ini", ".ds_store"]);
const SKIP_PREFIXES = ["~$", "."];

function shouldSkipFile(name: string): boolean {
  const lower = name.toLowerCase();
  if (SKIP_NAMES.has(lower)) return true;
  if (SKIP_PREFIXES.some((p) => name.startsWith(p))) return true;
  if (lower.endsWith(".tmp") || lower.endsWith(".temp")) return true;
  return false;
}

function mimeFromExt(ext: string): string {
  switch (ext) {
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    default:
      return "image/jpeg";
  }
}

async function hashFile(filePath: string, fileSize: number): Promise<string> {
  const maxFullHash = 8 * 1024 * 1024;
  if (fileSize > maxFullHash) {
    const head = await readFileChunk(filePath, 0, 65536);
    const tail = await readFileChunk(filePath, Math.max(0, fileSize - 65536), 65536);
    return createHash("sha256").update(String(fileSize)).update(head).update(tail).digest("hex");
  }

  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);
  });
}

function readFileChunk(filePath: string, start: number, length: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const stream = createReadStream(filePath, { start, end: start + length - 1 });
    stream.on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

export type LocalFileRecord = {
  localPath: string;
  relativePath: string;
  filename: string;
  mimeType: string;
  fileSize: number;
  fileCreatedAt: Date;
  fileModifiedAt: Date;
  fileHash: string;
  driveFolderPath: string;
  driveMainFolder: string | null;
  driveSubfolder: string | null;
  category: IgImageCategory | null;
  clientName: string | null;
  previewUrl: string;
};

export function isPathInsideRoot(filePath: string, rootPath: string): boolean {
  const resolved = path.resolve(filePath);
  const root = path.resolve(rootPath);
  return resolved === root || resolved.startsWith(root + path.sep);
}

export async function assertLocalDriveReadable(rootPath: string): Promise<void> {
  await access(rootPath);
  const rootStat = await stat(rootPath);
  if (!rootStat.isDirectory()) {
    throw new Error(`LOCAL_DRIVE_ROOT não é uma pasta: ${rootPath}`);
  }
}

/** Percorre o Drive local em lotes (somente leitura). */
export async function* indexLocalDriveBatched(
  rootPath: string,
  apiBase: string,
  batchSize = 80
): AsyncGenerator<LocalFileRecord[]> {
  await assertLocalDriveReadable(rootPath);
  const root = path.resolve(rootPath);
  let batch: LocalFileRecord[] = [];
  const stack = [root];

  while (stack.length > 0) {
    const dir = stack.pop()!;
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const full = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        stack.push(full);
        continue;
      }
      if (!entry.isFile() || shouldSkipFile(entry.name)) continue;

      const ext = path.extname(entry.name).toLowerCase();
      if (!LOCAL_IMAGE_EXT.has(ext)) continue;

      let fileStat;
      try {
        fileStat = await stat(full);
      } catch {
        continue;
      }

      const relativePath = path.relative(root, full).replace(/\\/g, "/");
      const folderPath = path.dirname(relativePath).replace(/\\/g, "/");
      const driveFolderPath = folderPath === "." ? "Raiz" : folderPath.replace(/\//g, " / ");
      const { mainFolder, subfolder } = splitDrivePath(folderPath === "." ? "" : folderPath);

      let fileHash: string;
      try {
        fileHash = await hashFile(full, fileStat.size);
      } catch {
        fileHash = createHash("sha256").update(`${full}:${fileStat.mtimeMs}:${fileStat.size}`).digest("hex");
      }

      batch.push({
        localPath: full,
        relativePath,
        filename: entry.name,
        mimeType: mimeFromExt(ext),
        fileSize: fileStat.size,
        fileCreatedAt: fileStat.birthtime,
        fileModifiedAt: fileStat.mtime,
        fileHash,
        driveFolderPath,
        driveMainFolder: mainFolder,
        driveSubfolder: subfolder,
        category: detectCategoryFromPath(relativePath, entry.name),
        clientName: detectClientFromPath(relativePath, entry.name),
        previewUrl: `${apiBase}/api/admin/instagram/media/local?path=${encodeURIComponent(full)}`,
      });

      if (batch.length >= batchSize) {
        yield batch;
        batch = [];
      }
    }
  }

  if (batch.length > 0) {
    yield batch;
  }
}

/** Lista completa (use indexLocalDriveBatched em pastas grandes). */
export async function indexLocalDriveFolder(rootPath: string, apiBase: string): Promise<LocalFileRecord[]> {
  const all: LocalFileRecord[] = [];
  for await (const batch of indexLocalDriveBatched(rootPath, apiBase)) {
    all.push(...batch);
  }
  return all;
}
