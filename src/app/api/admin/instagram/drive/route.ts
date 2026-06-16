import { requireAdminSession } from "@/lib/instagram/auth";
import { getDriveConfig, isDriveApiConfigured, isLocalDriveConfigured } from "@/lib/instagram/drive/config";
import { testDriveConnection } from "@/lib/instagram/drive/google-api";
import { checkMetaImageUrl } from "@/lib/instagram/drive/meta-publish";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const configSchema = z.object({
  googleDriveFolderId: z.string().optional().nullable(),
  googleDriveLocalPath: z.string().optional().nullable(),
});

export async function GET(req: Request) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const folder = searchParams.get("folder");
  const source = searchParams.get("source");
  const q = searchParams.get("q");

  const brand = await prisma.instagramBrandConfig.findFirst({ orderBy: { createdAt: "asc" } });
  const env = getDriveConfig();

  const images = await prisma.instagramImage.findMany({
    where: {
      ...(brand ? { brandConfigId: brand.id } : {}),
      sourceProvider: source ? source : { in: ["google_drive", "local_dev"] },
      ...(folder ? { driveFolderPath: { contains: folder, mode: "insensitive" } } : {}),
      ...(q
        ? {
            OR: [
              { filename: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
              { driveFolderPath: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  const withMeta = images.map((img) => ({
    ...img,
    metaCheck: checkMetaImageUrl(img.metaPublishUrl ?? img.url),
  }));

  return NextResponse.json({
    brand: brand
      ? {
          googleDriveFolderId: brand.googleDriveFolderId,
          googleDriveLocalPath: brand.googleDriveLocalPath,
          googleDriveLastSyncAt: brand.googleDriveLastSyncAt,
          googleDriveLastSyncError: brand.googleDriveLastSyncError,
          googleDriveSyncCount: brand.googleDriveSyncCount,
        }
      : null,
    env: {
      folderId: env.folderId,
      localPath: env.localPath,
      apiConfigured: isDriveApiConfigured(),
      localConfigured: isLocalDriveConfigured(),
    },
    images: withMeta,
  });
}

export async function PUT(req: Request) {
  const { error } = await requireAdminSession();
  if (error) return error;

  try {
    const brand = await prisma.instagramBrandConfig.findFirst({ orderBy: { createdAt: "asc" } });
    if (!brand) return NextResponse.json({ error: "Configure a marca primeiro." }, { status: 400 });

    const data = configSchema.parse(await req.json());
    const updated = await prisma.instagramBrandConfig.update({
      where: { id: brand.id },
      data: {
        googleDriveFolderId: data.googleDriveFolderId ?? brand.googleDriveFolderId,
        googleDriveLocalPath: data.googleDriveLocalPath ?? brand.googleDriveLocalPath,
      },
    });

    return NextResponse.json({
      googleDriveFolderId: updated.googleDriveFolderId,
      googleDriveLocalPath: updated.googleDriveLocalPath,
    });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0].message }, { status: 400 });
    return NextResponse.json({ error: "Erro ao salvar configuração" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { error } = await requireAdminSession();
  if (error) return error;

  try {
    const body = await req.json().catch(() => ({}));
    const folderId = body.folderId as string | undefined;
    if (!folderId) return NextResponse.json({ error: "folderId obrigatório para testar conexão." }, { status: 400 });
    const result = await testDriveConnection(folderId);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Falha ao conectar Google Drive";
    return NextResponse.json({ ok: false, message, fileCount: 0 }, { status: 400 });
  }
}
