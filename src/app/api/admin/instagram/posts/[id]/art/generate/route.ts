import { generateCompleteArt } from "@/lib/instagram/art/generate";
import { generateArtSchema } from "@/lib/instagram/art/schemas";
import { requireAdminSession } from "@/lib/instagram/auth";
import { NextResponse } from "next/server";
import { z } from "zod";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdminSession();
  if (error) return error;

  try {
    const body = req.headers.get("content-length") === "0" ? {} : await req.json();
    const input = generateArtSchema.parse(body);
    const result = await generateCompleteArt(params.id, input);
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0].message }, { status: 400 });
    if (e instanceof Error) return NextResponse.json({ error: e.message }, { status: 500 });
    return NextResponse.json({ error: "Erro ao gerar arte" }, { status: 500 });
  }
}
