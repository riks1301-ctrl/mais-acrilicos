import type { IgContentType } from "@prisma/client";
import type { BrandContext } from "@/lib/instagram/types";
import { CAROUSEL_SLIDE_TYPES } from "@/lib/instagram/images/constants";
import { pickSegment, pickService } from "./context";

export type CarouselSlideData = {
  order: number;
  slideType: string;
  headline: string;
  body: string;
  notes?: string;
};

export function generateCarouselSlides(
  brand: BrandContext,
  post: { title: string; idea?: string | null; contentType?: IgContentType | null }
): CarouselSlideData[] {
  const segment = pickSegment(brand);
  const service = pickService(brand);
  const diff = brand.differentials[0] ?? "produção sob medida";

  const templates: Record<string, { headline: string; body: string }> = {
    hook: {
      headline: post.title,
      body: `Se você tem ${segment}, isso impacta direto nas suas vendas. Arraste para ver o que muda com comunicação visual profissional.`,
    },
    problem: {
      headline: "O problema é silencioso",
      body: `PDV mal sinalizado, promoção sem destaque e vitrine amadora fazem o cliente passar reto. Você investe em estoque e perde na exposição.`,
    },
    solution: {
      headline: `${brand.companyName} resolve`,
      body: `Projetamos e produzimos ${service.name.toLowerCase()} sob medida com ${diff.toLowerCase()}. Do briefing à entrega, foco em vender mais.`,
    },
    example: {
      headline: service.name,
      body: post.idea?.split(".")[0] ?? `${service.description} Ideal para ${segment}.`,
    },
    benefit: {
      headline: "O que você ganha",
      body: `Loja mais profissional, produto valorizado, ofertas visíveis e percepção de marca forte. Comunicação visual que trabalha como vendedor silencioso.`,
    },
    cta: {
      headline: "Peça seu orçamento",
      body: `📲 ${brand.mainCta}\n\nWhatsApp: ${brand.whatsappNumber}\n@${brand.instagramHandle}`,
    },
  };

  return CAROUSEL_SLIDE_TYPES.map((def) => ({
    order: def.order,
    slideType: def.type,
    headline: templates[def.type].headline,
    body: templates[def.type].body,
    notes: def.label,
  }));
}

export function carouselToExportJson(
  post: { id: string; title: string },
  slides: CarouselSlideData[],
  images?: { slideOrder: number; imageUrl: string }[]
) {
  return {
    version: 1,
    postId: post.id,
    title: post.title,
    exportedAt: new Date().toISOString(),
    format: "1080x1080",
    slides: slides.map((s) => ({
      order: s.order,
      type: s.slideType,
      headline: s.headline,
      body: s.body,
      backgroundImage: images?.find((i) => i.slideOrder === s.order)?.imageUrl ?? null,
    })),
    futureExport: ["png", "pdf"],
  };
}
