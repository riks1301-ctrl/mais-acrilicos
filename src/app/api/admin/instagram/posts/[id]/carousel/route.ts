import { requireAdminSession } from "@/lib/instagram/auth";
import { carouselToExportJson, generateCarouselSlides } from "@/lib/instagram/generator/carousel";
import { getBrandContextWithServices } from "@/lib/instagram/generator/context";
import { updateCarouselSchema } from "@/lib/instagram/images/schemas";
import { logPublication } from "@/lib/instagram/persistence";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const carousel = await prisma.instagramCarousel.findUnique({
    where: { postId: params.id },
    include: {
      slides: { orderBy: { order: "asc" }, include: { backgroundImage: true } },
    },
  });

  return NextResponse.json(carousel);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdminSession();
  if (error) return error;

  try {
    const brand = await getBrandContextWithServices();
    if (!brand) return NextResponse.json({ error: "Configure a marca primeiro." }, { status: 400 });

    const post = await prisma.instagramPost.findUnique({ where: { id: params.id } });
    if (!post) return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });

    const slides = generateCarouselSlides(brand, {
      title: post.title,
      idea: post.idea,
      contentType: post.contentType,
    });

    const exportJson = carouselToExportJson({ id: post.id, title: post.title }, slides);

    const existing = await prisma.instagramCarousel.findUnique({ where: { postId: params.id } });
    if (existing) {
      await prisma.instagramCarouselSlide.deleteMany({ where: { carouselId: existing.id } });
    }

    const carousel = await prisma.instagramCarousel.upsert({
      where: { postId: params.id },
      create: {
        postId: params.id,
        exportJson,
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
      update: {
        exportJson,
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
      include: { slides: { orderBy: { order: "asc" }, include: { backgroundImage: true } } },
    });

    await prisma.instagramPost.update({
      where: { id: params.id },
      data: { format: "CAROUSEL" },
    });

    await logPublication(params.id, "carousel_generated", { slideCount: slides.length });
    return NextResponse.json(carousel, { status: 201 });
  } catch (e) {
    if (e instanceof Error) return NextResponse.json({ error: e.message }, { status: 500 });
    return NextResponse.json({ error: "Erro ao gerar carrossel" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdminSession();
  if (error) return error;

  try {
    const { slides } = updateCarouselSchema.parse(await req.json());

    const carousel = await prisma.instagramCarousel.findUnique({ where: { postId: params.id } });
    if (!carousel) return NextResponse.json({ error: "Carrossel não encontrado. Gere primeiro." }, { status: 404 });

    const post = await prisma.instagramPost.findUnique({ where: { id: params.id } });

    for (const slide of slides) {
      if (slide.id) {
        await prisma.instagramCarouselSlide.update({
          where: { id: slide.id },
          data: {
            order: slide.order,
            slideType: slide.slideType,
            headline: slide.headline,
            body: slide.body,
            backgroundImageId: slide.backgroundImageId ?? null,
            notes: slide.notes ?? null,
          },
        });
      }
    }

    const updated = await prisma.instagramCarousel.findUnique({
      where: { postId: params.id },
      include: {
        slides: { orderBy: { order: "asc" }, include: { backgroundImage: true } },
      },
    });

    if (updated && post) {
      const exportJson = carouselToExportJson(
        { id: post.id, title: post.title },
        updated.slides.map((s) => ({
          order: s.order,
          slideType: s.slideType,
          headline: s.headline,
          body: s.body,
        })),
        updated.slides
          .filter((s) => s.backgroundImage)
          .map((s) => ({ slideOrder: s.order, imageUrl: s.backgroundImage!.url }))
      );

      await prisma.instagramCarousel.update({
        where: { id: carousel.id },
        data: { exportJson },
      });
    }

    await logPublication(params.id, "carousel_updated", { slideCount: slides.length });
    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors[0].message }, { status: 400 });
    return NextResponse.json({ error: "Erro ao atualizar carrossel" }, { status: 500 });
  }
}
