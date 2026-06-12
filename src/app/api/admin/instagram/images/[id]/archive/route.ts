import { requireAdminSession } from "@/lib/instagram/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const image = await prisma.instagramImage.update({
    where: { id: params.id },
    data: { status: "ARCHIVED" },
  });

  return NextResponse.json(image);
}
