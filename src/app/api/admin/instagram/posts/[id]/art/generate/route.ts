import { generateArtSchema } from "@/lib/instagram/art/schemas";
import {
  beginArtGeneration,
  completeArtGeneration,
  failArtGeneration,
  recoverStaleArtGeneration,
  resetArtGeneration,
  updateArtGenerationProgress,
} from "@/lib/instagram/art/status";
import { requireAdminSession } from "@/lib/instagram/auth";
import { logPublication } from "@/lib/instagram/persistence";
import { NextResponse } from "next/server";
import { z } from "zod";

export const maxDuration = 60;
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const postId = params.id;

  try {
    await recoverStaleArtGeneration(postId);

    const body = req.headers.get("content-length") === "0" ? {} : await req.json();
    const input = generateArtSchema.parse(body);
    const { generateCompleteArt } = await import("@/lib/instagram/art/generate");

    if (input.reset) {
      await resetArtGeneration(postId);
      return NextResponse.json({ ok: true, artGenStatus: "IDLE" });
    }

    if (input.prepareOnly) {
      const result = await generateCompleteArt(postId, input);
      return NextResponse.json(result);
    }

    if (input.slideOrder === 1) {
      const prep = await generateCompleteArt(postId, { ...input, prepareOnly: true });
      await beginArtGeneration(postId, prep.slideCount ?? 6);
    }

    const result = await generateCompleteArt(postId, input);

    if (input.slideOrder) {
      await updateArtGenerationProgress(postId, input.slideOrder);
    }

    if (input.finalize) {
      await completeArtGeneration(postId, true);
    }

    const post = await recoverStaleArtGeneration(postId);

    return NextResponse.json({ ...result, artGen: post }, { status: 201 });
  } catch (e) {
    const message = e instanceof z.ZodError ? e.errors[0].message : e instanceof Error ? e.message : "Erro ao gerar arte";
    await failArtGeneration(postId, message);
    await logPublication(postId, "art_generation_failed", { error: message }).catch(() => null);

    if (e instanceof z.ZodError) return NextResponse.json({ error: message, artGenStatus: "FAILED" }, { status: 400 });
    return NextResponse.json({ error: message, artGenStatus: "FAILED" }, { status: 500 });
  }
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const { error } = await requireAdminSession();
    if (error) return error;

    const artGen = await recoverStaleArtGeneration(params.id);
    return NextResponse.json({ artGen });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro ao consultar status";
    return NextResponse.json({ error: message, artGen: null }, { status: 500 });
  }
}
