import { requireAdminSession } from "@/lib/instagram/auth";
import { checkPostPublishEligibility } from "@/lib/instagram/meta/eligibility";
import { publishSingleImagePost } from "@/lib/instagram/meta/publish";
import { publishMetaSchema } from "@/lib/instagram/meta/schemas";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const post = await prisma.instagramPost.findUnique({
    where: { id: params.id },
    include: { postImages: { include: { image: true } }, carousel: { include: { slides: true } } },
  });
  if (!post) return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });

  const eligibility = await checkPostPublishEligibility(post, { allowApproved: true });
  return NextResponse.json(eligibility);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { session, error } = await requireAdminSession();
  if (error || !session) return error ?? NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    publishMetaSchema.parse(await req.json());
    const result = await publishSingleImagePost(params.id, { adminId: session.sub, manual: true });
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0].message }, { status: 400 });
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erro" }, { status: 500 });
  }
}
