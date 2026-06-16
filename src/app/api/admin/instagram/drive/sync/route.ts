import { requireAdminSession } from "@/lib/instagram/auth";
import { getDriveConfig, getLocalDriveRoot, isLocalDriveAvailable } from "@/lib/instagram/drive/config";
import { syncGoogleDriveCatalog, syncLocalDriveCatalog } from "@/lib/instagram/drive/sync";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const syncSchema = z.object({
  mode: z.enum(["google_drive", "local_dev", "auto"]).default("auto"),
});

export async function POST(req: Request) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const brand = await prisma.instagramBrandConfig.findFirst({ orderBy: { createdAt: "asc" } });
  if (!brand) return NextResponse.json({ error: "Configure a marca primeiro." }, { status: 400 });

  try {
    const { mode } = syncSchema.parse(await req.json().catch(() => ({})));
    const env = getDriveConfig();
    const folderId = brand.googleDriveFolderId ?? env.folderId;
    const localPath = brand.googleDriveLocalPath ?? getLocalDriveRoot();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    let result;
    const localOk = localPath && (await isLocalDriveAvailable());
    const useLocal = mode === "local_dev" || (mode === "auto" && localOk);
    const useDrive = mode === "google_drive" || (mode === "auto" && !localOk && folderId);

    if (useLocal && localPath && localOk) {
      result = await syncLocalDriveCatalog(brand.id, localPath, siteUrl);
    } else if (useDrive && folderId) {
      result = await syncGoogleDriveCatalog(brand.id, folderId);
    } else if (localPath && !localOk) {
      return NextResponse.json(
        { error: `Pasta local não encontrada ou inacessível: ${localPath}` },
        { status: 400 }
      );
    } else {
      return NextResponse.json(
        {
          error:
            "Configure GOOGLE_DRIVE_FOLDER_ID (produção) ou GOOGLE_DRIVE_LOCAL_PATH (dev) e salve no painel Drive.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro na sincronização";
    await prisma.instagramBrandConfig.update({
      where: { id: brand.id },
      data: { googleDriveLastSyncError: message },
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
