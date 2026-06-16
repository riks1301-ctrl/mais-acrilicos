import { readdir, stat } from "fs/promises";
import path from "path";
import { folderToCategory, IMAGE_EXT } from "./config";

export type LocalFileRecord = {
  localPath: string;
  filename: string;
  mimeType: string;
  driveFolderPath: string;
  category: ReturnType<typeof folderToCategory>;
  previewUrl: string;
};

function mimeFromExt(ext: string): string {
  switch (ext) {
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    default:
      return "image/jpeg";
  }
}

export async function indexLocalDriveFolder(rootPath: string, apiBase: string): Promise<LocalFileRecord[]> {
  const results: LocalFileRecord[] = [];

  async function walk(dir: string, folderPath: string) {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full, folderPath ? `${folderPath}/${entry.name}` : entry.name);
        continue;
      }
      if (!entry.isFile()) continue;

      const ext = path.extname(entry.name).toLowerCase();
      if (!IMAGE_EXT.has(ext)) continue;

      const folderName = folderPath.split("/").pop() ?? folderPath;
      results.push({
        localPath: full,
        filename: entry.name,
        mimeType: mimeFromExt(ext),
        driveFolderPath: folderPath || "Raiz",
        category: folderToCategory(folderName),
        previewUrl: `${apiBase}/api/admin/instagram/media/local?path=${encodeURIComponent(full)}`,
      });
    }
  }

  const rootStat = await stat(rootPath).catch(() => null);
  if (!rootStat?.isDirectory()) {
    throw new Error(`Pasta local não encontrada: ${rootPath}`);
  }

  await walk(rootPath, "");
  return results;
}

export function isPathInsideRoot(filePath: string, rootPath: string): boolean {
  const resolved = path.resolve(filePath);
  const root = path.resolve(rootPath);
  return resolved === root || resolved.startsWith(root + path.sep);
}
