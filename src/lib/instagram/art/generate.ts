import { carouselToExportJson, generateCarouselSlides } from "@/lib/instagram/generator/carousel";
import { getBrandContextWithServices } from "@/lib/instagram/generator/context";
import { logPublication } from "@/lib/instagram/persistence";
import { prisma } from "@/lib/prisma";
import { resolveArtTemplate, resolveBrandColors, resolveBrandFonts } from "./brand-library";
import { buildCanvaExportSpec } from "./canva-spec";
import { parseFormat } from "./dimensions";
import { pickBackgroundForSlide, type ImageCandidate } from "./pick-background";
import { renderSlideArt } from "./render";
import type { ArtTemplateId, GenerateArtResult, SlideRenderInput } from "./types";
import { saveImageBuffer } from "@/lib/instagram/images/storage";

function toCandidate(img: {
  id: string;
  url: string;
  storageKey: string | null;
  localPath?: string | null;
  sourceProvider?: string;
  imageType: ImageCandidate["imageType"];
  isRealPhoto: boolean;
  isGenerated: boolean;
  category: ImageCandidate["category"];
}): ImageCandidate {
  return {
    id: img.id,
    url: img.url,
    storageKey: img.storageKey,
    localPath: img.localPath,
    sourceProvider: img.sourceProvider,
    imageType: img.imageType,
    isRealPhoto: img.isRealPhoto,
    isGenerated: img.isGenerated,
    category: img.category,
  };
}

async function ensureCarousel(post: {
  id: string;
  title: string;
  idea: string | null;
  contentType: import("@prisma/client").IgContentType | null;
}) {
  const existing = await prisma.instagramCarousel.findUnique({
    where: { postId: post.id },
    include: { slides: { orderBy: { order: "asc" }, include: { backgroundImage: true } } },
  });
  if (existing?.slides.length) return existing;

  const brandCtx = await getBrandContextWithServices();
  if (!brandCtx) throw new Error("Configure a marca primeiro.");

  const slides = generateCarouselSlides(brandCtx, {
    title: post.title,
    idea: post.idea,
    contentType: post.contentType,
  });

  return prisma.instagramCarousel.upsert({
    where: { postId: post.id },
    create: {
      postId: post.id,
      exportJson: carouselToExportJson({ id: post.id, title: post.title }, slides),
      slides: {
        create: slides.map((s) => ({
          order: s.order,
          slideType: s.slideType,
          headline: s.headline,
          body: s.body,
          notes: s.notes,
        })),
      },
    },
    update: {},
    include: { slides: { orderBy: { order: "asc" }, include: { backgroundImage: true } } },
  });
}

export async function generateCompleteArt(
  postId: string,
  opts?: { templateId?: ArtTemplateId; format?: string; slideOrder?: number; prepareOnly?: boolean; finalize?: boolean }
): Promise<GenerateArtResult> {
  const post = await prisma.instagramPost.findUnique({
    where: { id: postId },
    include: {
      brandConfig: true,
      postImages: { include: { image: true } },
      carousel: { include: { slides: { orderBy: { order: "asc" }, include: { backgroundImage: true } } } },
    },
  });
  if (!post?.brandConfig) throw new Error("Post ou marca não encontrados.");

  const brand = post.brandConfig;
  const templateId = opts?.templateId ?? resolveArtTemplate(brand);
  const dims = parseFormat(opts?.format ?? post.visualFormat);
  const colors = resolveBrandColors(brand);
  const fonts = resolveBrandFonts(brand);

  const carousel = post.carousel?.slides.length ? post.carousel : await ensureCarousel(post);
  const slides = carousel.slides;

  if (opts?.prepareOnly) {
    return {
      files: [],
      usedRealPhotos: 0,
      usedTemplates: 0,
      skippedAi: true,
      slideCount: slides.length,
      canvaSpec: null,
    };
  }

  const slideOrders = opts?.slideOrder ? [opts.slideOrder] : slides.map((s) => s.order);

  const libraryImages = await prisma.instagramImage.findMany({
    where: { brandConfigId: brand.id, status: "AVAILABLE" },
    orderBy: { createdAt: "desc" },
    take: 80,
  });

  const postImageCandidates = post.postImages.map((pi) => toCandidate(pi.image));
  const libraryCandidates = libraryImages.map((img) => toCandidate(img));
  const usedIds = new Set<string>();
  let usedRealPhotos = 0;
  let usedTemplates = 0;

  const renderedFiles: GenerateArtResult["files"] = [];

  if (!opts?.slideOrder) {
    await prisma.instagramPostImage.deleteMany({
      where: { postId, role: { in: ["cover", "slide", "art"] } },
    });
  }

  for (const order of slideOrders) {
    const slide = slides.find((s) => s.order === order);
    if (!slide) throw new Error(`Slide ${order} não encontrado no carrossel.`);

    if (opts?.slideOrder) {
      await prisma.instagramPostImage.deleteMany({
        where: { postId, role: { in: ["cover", "slide", "art"] }, order },
      });
    }

    const bg = slide.backgroundImage ? toCandidate(slide.backgroundImage) : null;
    const pick = pickBackgroundForSlide(slide.slideType, bg, postImageCandidates, libraryCandidates, usedIds);

    if (pick.source === "real_photo" && pick.image) {
      usedIds.add(pick.image.id);
      usedRealPhotos++;
    } else {
      usedTemplates++;
    }

    const slideInput: SlideRenderInput = {
      order: slide.order,
      slideType: slide.slideType,
      headline: slide.headline,
      body: slide.body,
    };

    const buffer = await renderSlideArt({
      slide: slideInput,
      dims,
      colors,
      fonts,
      templateId,
      companyName: brand.companyName,
      logoUrl: brand.logoUrl,
      photoStorageKey: pick.image?.storageKey,
      photoUrl: pick.image?.url,
      photoLocalPath: pick.image?.localPath,
      outputMime: "image/png",
    });

    const saved = await saveImageBuffer(buffer, "image/png", `art-${postId}-slide-${slide.order}`);

    const image = await prisma.instagramImage.create({
      data: {
        brandConfigId: brand.id,
        url: saved.publicUrl,
        storageKey: saved.storageKey,
        mimeType: saved.mimeType,
        fileSize: saved.fileSize,
        filename: saved.filename,
        status: "AVAILABLE",
        imageType: "COMMERCIAL_ART",
        isRealPhoto: pick.source === "real_photo",
        isGenerated: true,
        isConcept: false,
        format: dims.format,
        description: `Arte gerada — slide ${slide.order} (${slide.slideType})`,
        tags: ["arte_gerada", slide.slideType, templateId],
      },
    });

    const role = slide.order === 1 ? "cover" : "slide";
    await prisma.instagramPostImage.create({
      data: { postId, imageId: image.id, order: slide.order, role },
    });

    renderedFiles.push({
      imageId: image.id,
      url: saved.publicUrl,
      storageKey: saved.storageKey,
      role,
      order: slide.order,
      format: dims.format,
      mimeType: saved.mimeType,
      source: pick.source === "real_photo" ? "real_photo" : "brand_template",
    });
  }

  const isComplete =
    opts?.finalize ||
    (!opts?.slideOrder && slideOrders.length === slides.length) ||
    (opts?.slideOrder
      ? (await prisma.instagramPostImage.count({
          where: { postId, role: { in: ["cover", "slide", "art"] } },
        })) >= slides.length
      : false);

  if (isComplete) {
    const allPostImages = await prisma.instagramPostImage.findMany({
      where: { postId, role: { in: ["cover", "slide", "art"] } },
      include: { image: true },
      orderBy: { order: "asc" },
    });

    const allFiles: GenerateArtResult["files"] = allPostImages.map((pi) => ({
      imageId: pi.image.id,
      url: pi.image.url,
      storageKey: pi.image.storageKey ?? "",
      role: pi.role,
      order: pi.order,
      format: dims.format,
      mimeType: pi.image.mimeType ?? "image/png",
      source: pi.image.isRealPhoto ? "real_photo" : "brand_template",
    }));

    const canvaSpec = buildCanvaExportSpec({
      postId,
      title: post.title,
      templateId,
      files: allFiles,
      slides: slides.map((s) => ({
        order: s.order,
        slideType: s.slideType,
        headline: s.headline,
        body: s.body,
      })),
    });

    const exportJson = {
      ...carouselToExportJson(
        { id: post.id, title: post.title },
        slides.map((s) => ({
          order: s.order,
          slideType: s.slideType,
          headline: s.headline,
          body: s.body,
        })),
        allFiles.map((f) => ({ slideOrder: f.order, imageUrl: f.url }))
      ),
      artGeneratedAt: new Date().toISOString(),
      artFiles: allFiles,
      canvaSpec,
      exportFormats: ["png", "jpg", "pdf", "zip"],
    };

    await prisma.instagramCarousel.update({
      where: { postId },
      data: { exportJson },
    });

    await prisma.instagramPost.update({
      where: { id: postId },
      data: {
        format: "CAROUSEL",
        visualSource: usedRealPhotos > 0 ? "MIXED" : "MOCKUP",
        visualFormat: dims.format,
      },
    });

    await logPublication(postId, "art_generated", {
      slideCount: allFiles.length,
      usedRealPhotos,
      usedTemplates,
      templateId,
    });

    return {
      files: allFiles,
      usedRealPhotos,
      usedTemplates,
      skippedAi: true,
      slideCount: slides.length,
      canvaSpec,
    };
  }

  return {
    files: renderedFiles,
    usedRealPhotos,
    usedTemplates,
    skippedAi: true,
    slideCount: slides.length,
    canvaSpec: null,
  };
}
