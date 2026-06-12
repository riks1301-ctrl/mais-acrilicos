import { requireAdminSession } from "@/lib/instagram/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const brand = await prisma.instagramBrandConfig.findFirst({ orderBy: { createdAt: "asc" } });
  if (!brand) return NextResponse.json({ entries: [], timeline: [] });

  const dateFrom = from ? new Date(from) : new Date(new Date().setDate(new Date().getDate() - 7));
  const dateTo = to ? new Date(to) : new Date(new Date().setDate(new Date().getDate() + 28));

  const postInclude = {
    captions: { where: { isSelected: true }, take: 1 },
    postImages: { take: 1, include: { image: true } },
  };

  const [entries, timelinePosts] = await Promise.all([
    prisma.editorialCalendarEntry.findMany({
      where: { brandConfigId: brand.id, date: { gte: dateFrom, lte: dateTo } },
      orderBy: { date: "asc" },
      include: { post: { include: postInclude } },
    }),
    prisma.instagramPost.findMany({
      where: {
        brandConfigId: brand.id,
        status: { in: ["APPROVED", "SCHEDULED", "PUBLISHED", "PENDING_APPROVAL", "CREATING"] },
        OR: [
          { scheduledFor: { gte: dateFrom, lte: dateTo } },
          { publishedAt: { gte: dateFrom, lte: dateTo } },
          { suggestedDate: { gte: dateFrom, lte: dateTo } },
        ],
      },
      orderBy: { scheduledFor: "asc" },
      include: postInclude,
    }),
  ]);

  const timeline = timelinePosts.map((post) => ({
    id: post.id,
    title: post.title,
    status: post.status,
    date: post.scheduledFor ?? post.publishedAt ?? post.suggestedDate ?? post.createdAt,
    scheduledFor: post.scheduledFor,
    publishedAt: post.publishedAt,
    manualPublished: post.manualPublished,
    publicationChannel: post.publicationChannel,
    hook: post.captions[0]?.hook ?? post.finalCaption?.slice(0, 80),
    imageUrl: post.postImages[0]?.image.url ?? null,
  }));

  return NextResponse.json({ entries, timeline });
}
