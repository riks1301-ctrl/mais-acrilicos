import type { IgArtGenStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const ART_GEN_STALE_MS = 5 * 60 * 1000;
export const ART_GEN_SLIDE_TIMEOUT_MS = 90_000;

export type ArtGenSnapshot = {
  artGenStatus: IgArtGenStatus;
  artGenError: string | null;
  artGenProgress: number;
  artGenTotal: number;
  artGenStartedAt: Date | null;
  artGenFinishedAt: Date | null;
};

export function isArtGenStale(startedAt: Date | null | undefined): boolean {
  if (!startedAt) return false;
  return Date.now() - startedAt.getTime() > ART_GEN_STALE_MS;
}

export async function recoverStaleArtGeneration(postId: string): Promise<ArtGenSnapshot | null> {
  const post = await prisma.instagramPost.findUnique({
    where: { id: postId },
    select: {
      artGenStatus: true,
      artGenError: true,
      artGenProgress: true,
      artGenTotal: true,
      artGenStartedAt: true,
      artGenFinishedAt: true,
    },
  });
  if (!post || post.artGenStatus !== "GENERATING" || !isArtGenStale(post.artGenStartedAt)) {
    return post;
  }

  return prisma.instagramPost.update({
    where: { id: postId },
    data: {
      artGenStatus: "FAILED",
      artGenError: "Geração expirou (timeout). Clique em Tentar novamente.",
      artGenFinishedAt: new Date(),
    },
    select: {
      artGenStatus: true,
      artGenError: true,
      artGenProgress: true,
      artGenTotal: true,
      artGenStartedAt: true,
      artGenFinishedAt: true,
    },
  });
}

export async function beginArtGeneration(postId: string, total: number) {
  return prisma.instagramPost.update({
    where: { id: postId },
    data: {
      artGenStatus: "GENERATING",
      artGenError: null,
      artGenStartedAt: new Date(),
      artGenFinishedAt: null,
      artGenProgress: 0,
      artGenTotal: total,
    },
  });
}

export async function updateArtGenerationProgress(postId: string, progress: number) {
  return prisma.instagramPost.update({
    where: { id: postId },
    data: { artGenProgress: progress },
  });
}

export async function completeArtGeneration(postId: string, ok: boolean, error?: string) {
  return prisma.instagramPost.update({
    where: { id: postId },
    data: {
      artGenStatus: ok ? "READY" : "FAILED",
      artGenError: ok ? null : error ?? "Erro desconhecido na geração",
      artGenFinishedAt: new Date(),
      artGenProgress: ok ? undefined : undefined,
    },
  });
}

export async function resetArtGeneration(postId: string) {
  return prisma.instagramPost.update({
    where: { id: postId },
    data: {
      artGenStatus: "IDLE",
      artGenError: null,
      artGenStartedAt: null,
      artGenFinishedAt: null,
      artGenProgress: 0,
      artGenTotal: 0,
    },
  });
}

/** Remove slides gerados automaticamente; mantém fotos reais vinculadas pelo usuário. */
export async function removeGeneratedArtFromPost(postId: string) {
  const links = await prisma.instagramPostImage.findMany({
    where: { postId, role: { in: ["cover", "slide", "art"] } },
    include: { image: { select: { isGenerated: true } } },
  });
  const generatedLinkIds = links.filter((l) => l.image.isGenerated).map((l) => l.id);
  if (generatedLinkIds.length > 0) {
    await prisma.instagramPostImage.deleteMany({ where: { id: { in: generatedLinkIds } } });
  }
  await resetArtGeneration(postId);
  return generatedLinkIds.length;
}

export async function failArtGeneration(postId: string, message: string) {
  try {
    return await completeArtGeneration(postId, false, message);
  } catch {
    return null;
  }
}
