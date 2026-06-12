import { requireAdminSession } from "@/lib/instagram/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import type { IgPostStatus } from "@prisma/client";

export async function GET() {
  const { error } = await requireAdminSession();
  if (error) return error;

  const brand = await prisma.instagramBrandConfig.findFirst({ orderBy: { createdAt: "asc" } });

  const statuses: IgPostStatus[] = [
    "IDEA",
    "CREATING",
    "PENDING_APPROVAL",
    "APPROVED",
    "SCHEDULED",
    "PUBLISHED",
    "REJECTED",
    "ERROR",
  ];

  const counts = await Promise.all(
    statuses.map(async (status) => ({
      status,
      count: await prisma.instagramPost.count({
        where: brand ? { brandConfigId: brand.id, status } : { status },
      }),
    }))
  );

  const [personas, campaigns, services, pendingApproval, scheduled] = await Promise.all([
    prisma.instagramPersona.count({ where: brand ? { brandConfigId: brand.id } : undefined }),
    prisma.instagramCampaign.count({ where: brand ? { brandConfigId: brand.id } : undefined }),
    prisma.instagramService.count(),
    prisma.instagramPost.count({
      where: brand ? { brandConfigId: brand.id, status: "PENDING_APPROVAL" } : { status: "PENDING_APPROVAL" },
    }),
    prisma.instagramPost.count({
      where: brand ? { brandConfigId: brand.id, status: "SCHEDULED" } : { status: "SCHEDULED" },
    }),
  ]);

  return NextResponse.json({
    brandConfigured: !!brand,
    publicationMode: brand?.publicationMode ?? "MANUAL",
    metaConnected: brand?.metaConnected ?? false,
    instagramHandle: brand?.instagramHandle ?? null,
    statusCounts: Object.fromEntries(counts.map((c) => [c.status, c.count])),
    personas,
    campaigns,
    services,
    pendingApproval,
    scheduled,
  });
}
