import { requireAdminSession } from "@/lib/instagram/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const [logs, approvals] = await Promise.all([
    prisma.publicationLog.findMany({
      where: { postId: params.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.instagramApproval.findMany({
      where: { postId: params.id },
      orderBy: { reviewedAt: "desc" },
    }),
  ]);

  return NextResponse.json({ logs, approvals });
}
