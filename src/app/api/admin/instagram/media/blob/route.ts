import { requireAdminSession } from "@/lib/instagram/auth";
import { instagramBlobPathname, readBlobBuffer } from "@/lib/instagram/images/blob";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const key = new URL(req.url).searchParams.get("key");
  if (!key || key.includes("..") || key.includes("/")) {
    return NextResponse.json({ error: "Parâmetro key inválido." }, { status: 400 });
  }

  const buffer = await readBlobBuffer(instagramBlobPathname(key), "private");
  if (!buffer) {
    return NextResponse.json({ error: "Arquivo não encontrado no Blob." }, { status: 404 });
  }

  const ext = key.split(".").pop()?.toLowerCase();
  const mime =
    ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : ext === "gif" ? "image/gif" : "image/jpeg";

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": mime,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
