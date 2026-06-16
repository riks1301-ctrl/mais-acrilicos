import type { IgImageCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { themesFromPostText } from "./classify";

export type ScoredImage = {
  id: string;
  url: string;
  filename: string | null;
  category: IgImageCategory | null;
  clientName: string | null;
  fileSize: number | null;
  imageWidth: number | null;
  imageHeight: number | null;
  score: number;
};

function resolutionScore(fileSize: number | null, width: number | null, height: number | null): number {
  if (width && height) return width * height;
  if (fileSize) return Math.min(fileSize / 1024, 5000);
  return 0;
}

function scoreImage(
  img: {
    category: IgImageCategory | null;
    clientName: string | null;
    fileSize: number | null;
    imageWidth: number | null;
    imageHeight: number | null;
    filename: string | null;
    driveFolderPath: string | null;
  },
  preferredCategories: IgImageCategory[],
  preferredClients: string[],
  text: string
): number {
  let score = 1 + resolutionScore(img.fileSize, img.imageWidth, img.imageHeight);

  if (img.category && preferredCategories.includes(img.category)) {
    score += 10_000;
  }

  if (img.clientName && preferredClients.some((c) => c.toLowerCase() === img.clientName!.toLowerCase())) {
    score += 8_000;
  }

  const haystack = `${img.filename ?? ""} ${img.driveFolderPath ?? ""}`.toLowerCase();
  for (const cat of preferredCategories) {
    if (haystack.includes(cat.toLowerCase().replace(/_/g, " "))) score += 2_000;
  }

  if (text && haystack && text.split(/\s+/).some((w) => w.length > 4 && haystack.includes(w.toLowerCase()))) {
    score += 1_000;
  }

  return score;
}

/** Seleciona até N imagens reais do catálogo Drive/local para um post. */
export async function suggestImagesForPost(
  brandId: string,
  opts: { title: string; idea?: string | null; limit?: number }
): Promise<ScoredImage[]> {
  const limit = opts.limit ?? 10;
  const text = `${opts.title} ${opts.idea ?? ""}`;
  const { categories, clients } = themesFromPostText(opts.title, opts.idea);

  const images = await prisma.instagramImage.findMany({
    where: {
      brandConfigId: brandId,
      status: "AVAILABLE",
      isRealPhoto: true,
      sourceProvider: { in: ["google_drive", "local_dev"] },
    },
    select: {
      id: true,
      url: true,
      filename: true,
      category: true,
      clientName: true,
      fileSize: true,
      imageWidth: true,
      imageHeight: true,
      driveFolderPath: true,
    },
    take: 500,
  });

  const scored = images
    .map((img) => ({
      ...img,
      score: scoreImage(img, categories, clients, text.toLowerCase()),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored;
}

/** Vincula imagens sugeridas ao post se ainda não houver imagens. */
export async function autoLinkSuggestedImages(
  postId: string,
  brandId: string,
  title: string,
  idea?: string | null
): Promise<{ linked: number }> {
  const existing = await prisma.instagramPostImage.count({ where: { postId } });
  if (existing > 0) return { linked: 0 };

  const suggestions = await suggestImagesForPost(brandId, { title, idea, limit: 10 });
  if (!suggestions.length) return { linked: 0 };

  for (let i = 0; i < suggestions.length; i++) {
    await prisma.instagramPostImage.create({
      data: {
        postId,
        imageId: suggestions[i].id,
        order: i,
        role: i === 0 ? "cover" : "attachment",
      },
    });
  }

  await prisma.instagramPost.update({
    where: { id: postId },
    data: { visualSource: "REAL" },
  });

  return { linked: suggestions.length };
}
