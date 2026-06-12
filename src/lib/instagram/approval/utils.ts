import type { InstagramCaption, InstagramPost } from "@prisma/client";

export const LOW_SCORE_THRESHOLD = 65;

export function parseCommercialScore(critiqueNotes: string | null): number | null {
  if (!critiqueNotes) return null;
  const m = critiqueNotes.match(/Score comercial:\s*(\d+)/);
  return m ? Number(m[1]) : null;
}

export function buildCaptionFromParts(cap: InstagramCaption): string {
  return `${cap.hook}\n\n${cap.body}\n\n${cap.cta}\n\n${cap.hashtags}`;
}

export function getSelectedCaption(captions: InstagramCaption[]): InstagramCaption | null {
  return captions.find((c) => c.isSelected) ?? captions[0] ?? null;
}

export function postHasVisual(post: {
  postImages?: { id: string }[];
  carousel?: { id: string } | null;
}): boolean {
  return (post.postImages?.length ?? 0) > 0 || !!post.carousel;
}

export function canApprovePost(
  post: InstagramPost & {
    captions: InstagramCaption[];
    postImages?: { id: string }[];
    carousel?: { id: string } | null;
  },
  options: { forceLowScore?: boolean; forceNoVisual?: boolean } = {}
): { ok: true } | { ok: false; error: string; code?: string } {
  const finalCaption = post.finalCaption?.trim();
  if (!finalCaption || finalCaption.length < 20) {
    return { ok: false, error: "Preencha a legenda final antes de aprovar.", code: "NO_FINAL_CAPTION" };
  }

  if (!post.finalCta?.trim()) {
    return { ok: false, error: "Preencha o CTA final antes de aprovar.", code: "NO_FINAL_CTA" };
  }

  const score = parseCommercialScore(post.critiqueNotes);
  if (score !== null && score < LOW_SCORE_THRESHOLD && !options.forceLowScore) {
    return {
      ok: false,
      error: `Score comercial ${score}/100 — confirme aprovação mesmo assim.`,
      code: "LOW_SCORE",
    };
  }

  if (!postHasVisual(post) && !options.forceNoVisual) {
    return {
      ok: false,
      error: "Post sem imagem ou carrossel — confirme se deseja aprovar assim.",
      code: "NO_VISUAL",
    };
  }

  if (!["PENDING_APPROVAL", "CREATING", "REJECTED"].includes(post.status)) {
    return { ok: false, error: `Status "${post.status}" não permite aprovação direta.` };
  }

  return { ok: true };
}

export function validateScheduleDate(scheduledFor: Date): { ok: true } | { ok: false; error: string } {
  if (scheduledFor.getTime() <= Date.now()) {
    return { ok: false, error: "A data/hora do agendamento deve ser no futuro." };
  }
  return { ok: true };
}
