import { requireAdminSession } from "@/lib/instagram/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import type { IgImageCategory, IgImageStatus } from "@prisma/client";

export async function GET(req: Request) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") as IgImageCategory | null;
  const status = searchParams.get("status") as IgImageStatus | null;
  const serviceId = searchParams.get("serviceId");
  const tag = searchParams.get("tag");
  const q = searchParams.get("q");

  const brand = await prisma.instagramBrandConfig.findFirst({ orderBy: { createdAt: "asc" } });

  const images = await prisma.instagramImage.findMany({
    where: {
      ...(brand ? { brandConfigId: brand.id } : {}),
      ...(category ? { category } : {}),
      ...(status ? { status } : {}),
      ...(serviceId ? { serviceId } : {}),
      ...(tag ? { tags: { has: tag } } : {}),
      ...(q
        ? {
            OR: [
              { description: { contains: q, mode: "insensitive" } },
              { clientProject: { contains: q, mode: "insensitive" } },
              { filename: { contains: q, mode: "insensitive" } },
              { tags: { has: q } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { service: true },
    take: 200,
  });

  return NextResponse.json(images);
}
