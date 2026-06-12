import { requireAdminSession } from "@/lib/instagram/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const { error } = await requireAdminSession();
  if (error) return error;

  const services = await prisma.instagramService.findMany({
    orderBy: [{ featured: "desc" }, { order: "asc" }],
    select: { id: true, name: true, category: true },
  });

  return NextResponse.json(services);
}
