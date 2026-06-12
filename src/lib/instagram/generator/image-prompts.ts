import type { IgContentType, IgImageType, IgPromptPurpose } from "@prisma/client";
import { PROMPT_PURPOSES } from "@/lib/instagram/images/constants";
import type { BrandContext } from "@/lib/instagram/types";

type PromptInput = {
  brand: BrandContext;
  title: string;
  idea?: string | null;
  contentType?: IgContentType | null;
  purpose: IgPromptPurpose;
  imageType: IgImageType;
};

function brandColors(brand: BrandContext): string {
  const colors = brand.brandColors as { primary?: string; secondary?: string; accent?: string } | null;
  if (!colors) return "azul profissional (#0369a1), branco limpo, detalhes em laranja (#f59e0b)";
  return `azul primário (${colors.primary}), azul secundário (${colors.secondary}), destaque (${colors.accent}), fundo claro`;
}

function typeDisclaimer(imageType: IgImageType): string {
  const map: Record<IgImageType, string> = {
    REAL: "IMPORTANTE: usar apenas como referência de estilo — substituir por foto real da empresa antes de publicar.",
    MOCKUP: "MARCAR COMO MOCKUP/CONCEITO — não apresentar como obra real entregue.",
    CONCEPT: "Arte conceitual para aprovação interna — não é foto de obra.",
    COMMERCIAL_ART: "Arte comercial para feed — layout profissional, não documentar como instalação real.",
  };
  return map[imageType];
}

function sceneForContent(contentType?: IgContentType | null): string {
  const scenes: Partial<Record<IgContentType, string>> = {
    PRODUCT_SHOWCASE: "display de acrílico em balcão de loja, produto em destaque, iluminação de PDV",
    BEFORE_AFTER: "composição split antes/depois de fachada ou PDV, contraste claro",
    BEHIND_SCENES: "bastidores de produção, corte de acrílico, acabamento profissional",
    RETAIL_TIPS: "ambiente de supermercado ou farmácia com sinalização organizada",
    DIRECT_OFFER: "composição comercial limpa com espaço para CTA, produto em evidência",
    PDV_IDEAS: "gôndola e balcão com materiais de comunicação visual",
    PRODUCT_CATALOG: "fachada comercial com letras e luminoso",
  };
  return scenes[contentType ?? "PRODUCT_SHOWCASE"] ?? "ambiente comercial brasileiro, PDV organizado";
}

export function generateImagePrompt(input: PromptInput): { prompt: string; format: string; styleNotes: string } {
  const purposeMeta = PROMPT_PURPOSES.find((p) => p.id === input.purpose)!;
  const colors = brandColors(input.brand);
  const scene = sceneForContent(input.contentType);
  const segment = input.brand.targetAudience[0] ?? "lojas de varejo";

  const prompt = [
    `Crie uma imagem ${purposeMeta.label} (${purposeMeta.format}, ${purposeMeta.ratio}) para ${input.brand.companyName}, comunicação visual e PDV.`,
    `Cena: ${scene}, segmento ${segment}.`,
    `Briefing do post: "${input.title}".${input.idea ? ` Contexto: ${input.idea.slice(0, 200)}` : ""}`,
    `Estilo: fotografia comercial premium, nitidez alta, iluminação natural, composição limpa, sem textos ilegíveis, sem logos de terceiros.`,
    `Paleta da marca: ${colors}.`,
    `Objetivo: gerar desejo de orçamento no WhatsApp — visual profissional que vende, não arte genérica de banco de imagens.`,
    typeDisclaimer(input.imageType),
  ].join(" ");

  const styleNotes = [
    `Formato: ${purposeMeta.format}`,
    `Tipo: ${input.imageType}`,
    `Marca: ${input.brand.companyName} (@${input.brand.instagramHandle})`,
    input.brand.visualGuidelines?.split("\n")[0] ?? "",
  ]
    .filter(Boolean)
    .join(" | ");

  return { prompt, format: purposeMeta.format, styleNotes };
}

export function generateAllPrompts(
  brand: BrandContext,
  post: { title: string; idea?: string | null; contentType?: IgContentType | null },
  imageType: IgImageType,
  purposes?: IgPromptPurpose[]
) {
  const list = purposes ?? PROMPT_PURPOSES.map((p) => p.id);
  return list.map((purpose) => ({
    purpose,
    imageType,
    isConcept: imageType !== "REAL",
    ...generateImagePrompt({ brand, ...post, purpose, imageType }),
  }));
}
