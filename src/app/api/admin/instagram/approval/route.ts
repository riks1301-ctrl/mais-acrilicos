import { requireAdminSession } from "@/lib/instagram/auth";
import { getApprovalQueue } from "@/lib/instagram/approval/service";
import { parseCommercialScore, postHasVisual } from "@/lib/instagram/approval/utils";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const statuses = status ? status.split(",") : undefined;

  const posts = await getApprovalQueue(statuses);

  const items = posts.map((post) => {
    const selected = post.captions.find((c) => c.isSelected) ?? post.captions[0];
    const service = post.postImages[0]?.image?.service?.name ?? null;
    const score = parseCommercialScore(post.critiqueNotes);
    const suggestedDate = post.suggestedDate ?? post.calendarEntries[0]?.date ?? null;

    return {
      ...post,
      commercialScore: score,
      hasVisual: postHasVisual(post),
      hasCarousel: !!post.carousel,
      serviceName: service,
      suggestedDate,
      selectedCaption: selected ?? null,
      warnings: [
        score !== null && score < 65 ? "Score comercial abaixo de 65" : null,
        !post.finalCaption ? "Sem legenda final" : null,
        !postHasVisual(post) ? "Sem imagem ou carrossel" : null,
      ].filter(Boolean),
    };
  });

  return NextResponse.json(items);
}
