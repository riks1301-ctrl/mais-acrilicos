import { requireAdminSession } from "@/lib/instagram/auth";
import { getDriveConfig, isDriveApiConfigured, isLocalDriveAvailable, shouldShowLocalDriveUi } from "@/lib/instagram/drive/config";
import { testDriveConnection } from "@/lib/instagram/drive/google-api";
import { checkMetaImageUrl } from "@/lib/instagram/drive/meta-publish";
import { resolveAdminImageSrc } from "@/lib/instagram/images/admin-url";
import { prisma } from "@/lib/prisma";
import type { IgImageCategory } from "@prisma/client";
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
  const mainFolder = searchParams.get("mainFolder");
  const source = searchParams.get("source");
  const category = searchParams.get("category") as IgImageCategory | null;
  const client = searchParams.get("client");
  const q = searchParams.get("q");
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(96, Math.max(12, Number(searchParams.get("limit") ?? "48")));

  const brand = await prisma.instagramBrandConfig.findFirst({ orderBy: { createdAt: "asc" } });
  const env = getDriveConfig();
  const showLocal = await shouldShowLocalDriveUi();
  const localAvailable = await isLocalDriveAvailable();

  const where = {
    ...(brand ? { brandConfigId: brand.id } : {}),
    sourceProvider: source ? source : { in: ["google_drive", "local_dev"] },
    status: "AVAILABLE" as const,
    ...(folder ? { driveFolderPath: { contains: folder, mode: "insensitive" as const } } : {}),
    ...(mainFolder ? { driveMainFolder: { equals: mainFolder, mode: "insensitive" as const } } : {}),
    ...(category ? { category } : {}),
    ...(client ? { clientName: { equals: client, mode: "insensitive" as const } } : {}),
    ...(q
      ? {
          OR: [
            { filename: { contains: q, mode: "insensitive" as const } },
            { description: { contains: q, mode: "insensitive" as const } },
            { driveFolderPath: { contains: q, mode: "insensitive" as const } },
            { clientName: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [total, images, categoryGroups, clientGroups] = await Promise.all([
    prisma.instagramImage.count({ where }),
    prisma.instagramImage.findMany({
      where,
      orderBy: [{ fileModifiedAt: "desc" }, { updatedAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.instagramImage.groupBy({
      by: ["category"],
      where: { ...where, category: { not: null } },
      _count: { _all: true },
    }),
    prisma.instagramImage.groupBy({
      by: ["clientName"],
      where: { ...where, clientName: { not: null } },
      _count: { _all: true },
    }),
  ]);

  const withMeta = images.map((img) => ({
    ...img,
    url: resolveAdminImageSrc(img),
    thumbnailUrl: img.thumbnailUrl ? resolveAdminImageSrc({ url: img.thumbnailUrl, localPath: img.localPath }) : null,
    metaCheck: checkMetaImageUrl(img.metaPublishUrl ?? resolveAdminImageSrc(img)),
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
      localDriveRoot: env.localDriveRoot,
      readOnly: env.readOnly,
      apiConfigured: isDriveApiConfigured(),
      localConfigured: !!env.localPath,
      localAvailable,
      showLocalUi: showLocal,
    },
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    stats: {
      categories: Object.fromEntries(
        categoryGroups.map((g) => [g.category ?? "SEM_CATEGORIA", g._count._all])
      ),
      clients: Object.fromEntries(
        clientGroups.map((g) => [g.clientName ?? "SEM_CLIENTE", g._count._all])
      ),
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
