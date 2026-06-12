import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  if (!(await getSession())) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  return NextResponse.json(await prisma.quote.findMany({ orderBy: { createdAt: "desc" } }));
}
