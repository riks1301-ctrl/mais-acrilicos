import { requireAdminSession } from "@/lib/instagram/auth";
import { getLocalDriveRoot } from "@/lib/instagram/drive/config";
import { isPathInsideRoot } from "@/lib/instagram/drive/local-index";
import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { error } = await requireAdminSession();
  if (error) return error;

  if (process.env.NODE_ENV === "production" && !process.env.ALLOW_LOCAL_DRIVE_MEDIA) {
    const root = getLocalDriveRoot();
    if (!root) {
      return NextResponse.json({ error: "Mídia local disponível apenas em desenvolvimento." }, { status: 403 });
    }
  }

  const filePath = new URL(req.url).searchParams.get("path");
  const root = getLocalDriveRoot() ?? process.env.GOOGLE_DRIVE_LOCAL_PATH;
  if (!filePath || !root) {
    return NextResponse.json({ error: "path ou GOOGLE_DRIVE_LOCAL_PATH ausente." }, { status: 400 });
  }

  if (!isPathInsideRoot(filePath, root)) {
    return NextResponse.json({ error: "Caminho fora da pasta permitida." }, { status: 403 });
  }

  try {
    const buffer = await readFile(path.resolve(filePath));
    const ext = path.extname(filePath).toLowerCase();
    const mime =
      ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : ext === ".gif" ? "image/gif" : "image/jpeg";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": mime,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Arquivo não encontrado." }, { status: 404 });
  }
}
