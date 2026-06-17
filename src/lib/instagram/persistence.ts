import type { IgPostStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { BrandContext, GeneratedIdea } from "@/lib/instagram/types";
import type { FullGeneration } from "./generator";

export async function logPublication(postId: string, action: string, details?: Prisma.InputJsonValue, errorMessage?: string) {
  await prisma.publicationLog.create({
    data: { postId, action, details, errorMessage },
  });
}

export async function saveIdeaAsPost(brand: BrandContext, idea: GeneratedIdea, status: IgPostStatus = "IDEA") {
  const post = await prisma.instagramPost.create({
    data: {
      title: idea.title,
      idea: idea.idea,
      format: idea.format,
      contentType: idea.contentType,
      status,
      brandConfigId: brand.id,
    },
  });
  await logPublication(post.id, "idea_created", { contentType: idea.contentType, format: idea.format });

  return post;
}

export async function saveFullGeneration(postId: string, gen: FullGeneration) {
  await prisma.instagramCaption.deleteMany({ where: { postId } });

  for (const cap of gen.captions) {
    await prisma.instagramCaption.create({
      data: {
        postId,
        version: cap.version,
        hook: cap.hook,
        body: cap.body,
        cta: cap.cta,
        hashtags: cap.hashtags,
        isSelected: cap.version === "A",
        critique: cap.version === "A" ? gen.critiqueText : null,
      },
    });
  }

  const newStatus: IgPostStatus = gen.critique.score >= 65 ? "PENDING_APPROVAL" : "CREATING";
  const selected = gen.captions.find((c) => c.version === "A") ?? gen.captions[0];

  const post = await prisma.instagramPost.update({
    where: { id: postId },
    data: {
      critiqueNotes: gen.critiqueText,
      status: newStatus,
      finalCaption: selected ? `${selected.hook}\n\n${selected.body}\n\n${selected.cta}\n\n${selected.hashtags}` : undefined,
      finalCta: selected?.cta,
      finalHashtags: selected?.hashtags,
    },
    include: { captions: true },
  });

  await logPublication(postId, "content_generated", {
    score: gen.critique.score,
    sells: gen.critique.sells,
    status: newStatus,
  });

  return post;
}

export async function saveCalendarWeek(
  brand: BrandContext,
  plans: { date: Date; dayTheme: string; idea: GeneratedIdea }[]
) {
  const results = [];

  for (const plan of plans) {
    const dayStart = new Date(plan.date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(plan.date);
    dayEnd.setHours(23, 59, 59, 999);

    const existing = await prisma.editorialCalendarEntry.findFirst({
      where: {
        brandConfigId: brand.id,
        date: { gte: dayStart, lte: dayEnd },
      },
    });

    if (existing) {
      results.push(existing);
      continue;
    }

    const post = await saveIdeaAsPost(brand, plan.idea, "CREATING");
    const gen = await import("./generator").then((m) => m.generateFullContent(brand, plan.idea));
    await saveFullGeneration(post.id, gen);

    const entry = await prisma.editorialCalendarEntry.create({
      data: {
        date: plan.date,
        dayTheme: plan.dayTheme,
        notes: plan.idea.idea,
        brandConfigId: brand.id,
        postId: post.id,
      },
      include: { post: { include: { captions: true } } },
    });

    await logPublication(post.id, "calendar_scheduled", { date: plan.date.toISOString() });
    results.push(entry);
  }

  return results;
}

export async function regeneratePostContent(postId: string, brand: BrandContext) {
  const post = await prisma.instagramPost.findUnique({ where: { id: postId } });
  if (!post) throw new Error("Post não encontrado");

  const idea: GeneratedIdea = {
    title: post.title,
    idea: post.idea ?? "",
    contentType: post.contentType ?? "RETAIL_TIPS",
    format: post.format,
  };

  const gen = await import("./generator").then((m) => m.generateFullContent(brand, idea));
  return saveFullGeneration(postId, gen);
}
