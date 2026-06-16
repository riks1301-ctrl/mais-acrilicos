import type { IgImageCategory, IgImageType } from "@prisma/client";

export type ImageCandidate = {
  id: string;
  url: string;
  storageKey: string | null;
  localPath?: string | null;
  sourceProvider?: string;
  imageType: IgImageType;
  isRealPhoto: boolean;
  isGenerated: boolean;
  category: IgImageCategory | null;
};

export type BackgroundPick = {
  source: "real_photo" | "brand_template";
  image?: ImageCandidate;
};

const SLIDE_CATEGORY_HINT: Record<string, IgImageCategory[]> = {
  hook: ["PDV", "DISPLAY", "OBRA_PRONTA"],
  problem: ["PDV", "BANNER"],
  solution: ["DISPLAY", "FACHADA", "LUMINOSO"],
  example: ["DISPLAY", "ACRILICO", "PDV", "OBRA_PRONTA"],
  benefit: ["OBRA_PRONTA", "ANTES_DEPOIS"],
  cta: ["DISPLAY", "PDV"],
};

function isRealUsable(img: ImageCandidate): boolean {
  return img.isRealPhoto && img.imageType === "REAL" && !img.isGenerated;
}

function scoreImage(img: ImageCandidate, slideType: string, used: Set<string>): number {
  if (!isRealUsable(img) || used.has(img.id)) return -1;
  const hints = SLIDE_CATEGORY_HINT[slideType] ?? [];
  if (img.category && hints.includes(img.category)) return 10;
  return 5;
}

export function pickBackgroundForSlide(
  slideType: string,
  explicitBackground: ImageCandidate | null | undefined,
  postImages: ImageCandidate[],
  libraryImages: ImageCandidate[],
  usedIds: Set<string>
): BackgroundPick {
  if (explicitBackground && isRealUsable(explicitBackground) && !usedIds.has(explicitBackground.id)) {
    return { source: "real_photo", image: explicitBackground };
  }

  const candidates = [...postImages, ...libraryImages]
    .map((img) => ({ img, score: scoreImage(img, slideType, usedIds) }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score);

  if (candidates[0]) {
    return { source: "real_photo", image: candidates[0].img };
  }

  return { source: "brand_template" };
}
