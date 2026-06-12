import type { ArtTemplateId, RenderedArtFile } from "./types";

/** Estrutura para integração futura com Canva Connect / Autofill API */
export function buildCanvaExportSpec(opts: {
  postId: string;
  title: string;
  templateId: ArtTemplateId;
  files: RenderedArtFile[];
  slides: { order: number; slideType: string; headline: string; body: string }[];
}) {
  return {
    version: 1,
    provider: "canva",
    status: "placeholder",
    postId: opts.postId,
    title: opts.title,
    templateId: opts.templateId,
    exportedAt: new Date().toISOString(),
    note: "Integração Canva pendente — use este JSON como contrato para Autofill/Design API.",
    design: {
      format: "instagram_carousel",
      dimensions: "1080x1080",
      brandTemplate: opts.templateId,
    },
    assets: opts.files.map((f) => ({
      role: f.role,
      order: f.order,
      url: f.url,
      format: f.format,
    })),
    slides: opts.slides.map((s) => ({
      order: s.order,
      type: s.slideType,
      headline: s.headline,
      body: s.body,
      assetUrl: opts.files.find((f) => f.order === s.order)?.url ?? null,
    })),
    futureActions: ["canva.autofill", "canva.export_pdf", "canva.brand_template_sync"],
  };
}
