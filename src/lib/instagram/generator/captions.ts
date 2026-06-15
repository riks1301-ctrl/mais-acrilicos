import type { BrandContext, GeneratedCaption, GeneratedIdea } from "@/lib/instagram/types";
import { buildHashtags, buildWhatsappCta, pickSegment, pickService } from "./context";

type CaptionInput = {
  brand: BrandContext;
  idea: GeneratedIdea;
  title: string;
};

const HOOKS_DIRECT: ((title: string) => string)[] = [
  (title) => `⚠️ ${title}`,
  (title) => `Você sabia? ${title.replace(/\?$/, "")}…`,
  (title) => (title.endsWith("?") ? title : `${title}?`),
  () => `Pare de perder venda por isso 👇`,
  () => `Isso muda o jogo no seu PDV:`,
];

const HOOKS_EDUCATIONAL: ((title: string) => string)[] = [
  (title) => `💡 ${title}`,
  (title) => `Guia rápido: ${title.toLowerCase()}`,
  () => `3 minutos que valem mais vendas:`,
];

function bodyDirect(input: CaptionInput): string {
  const { brand, idea, title } = input;
  const segment = pickSegment(brand);
  const service = pickService(brand);
  const diff = brand.differentials[0] ?? "produção sob medida";
  const brief = idea.idea.split(".").slice(0, 2).join(".") + ".";

  const lines = [
    brief,
    `${title} — isso é o que separa quem só abre a loja de quem faz o PDV vender.`,
    `Na ${brand.companyName}, produzimos ${service.name.toLowerCase()} com ${diff.toLowerCase()} para ${segment}.`,
    `Quer o mesmo resultado? Me chama no WhatsApp que montamos seu orçamento sem compromisso.`,
  ];
  return lines.join("\n\n");
}

function bodyEducational(input: CaptionInput): string {
  const { brand, idea } = input;
  const segment = pickSegment(brand);

  const lines = [
    idea.idea.split(".")[0] + ".",
    `Comunicação visual bem feita não é custo — é investimento que trabalha por você todos os dias.`,
    `Para ${segment}, a sinalização certa organiza o PDV, destaca ofertas e reforça sua marca.`,
    `Quer aplicar isso na sua loja? A ${brand.companyName} projeta e produz sob medida.`,
  ];
  return lines.join("\n\n");
}

function extraHashtags(idea: GeneratedIdea): string[] {
  const map: Record<string, string[]> = {
    RETAIL_TIPS: ["#dicasdevendas", "#lojista", "#varejobrasil"],
    PRODUCT_SHOWCASE: ["#display", "#expositor", "#sobmedida"],
    BEFORE_AFTER: ["#antesedepois", "#transformacao", "#obra"],
    DIRECT_OFFER: ["#orcamento", "#promocao", "#whatsapp"],
    BEHIND_SCENES: ["#bastidores", "#fabrica", "#producao"],
    REELS_PRODUCTION: ["#reels", "#processo", "#fabricacao"],
  };
  return map[idea.contentType] ?? ["#comunicacaovisual"];
}

export function generateCaptions(input: CaptionInput): GeneratedCaption[] {
  const { brand, idea, title } = input;
  const hashtags = buildHashtags(brand, extraHashtags(idea));
  const cta = buildWhatsappCta(brand);

  const versionA: GeneratedCaption = {
    version: "A",
    hook: HOOKS_DIRECT[Math.floor(Math.random() * HOOKS_DIRECT.length)](title),
    body: bodyDirect(input),
    cta,
    hashtags,
    fullText: "",
  };
  versionA.fullText = `${versionA.hook}\n\n${versionA.body}\n\n${versionA.cta}\n\n${versionA.hashtags}`;

  const versionB: GeneratedCaption = {
    version: "B",
    hook: HOOKS_EDUCATIONAL[Math.floor(Math.random() * HOOKS_EDUCATIONAL.length)](title),
    body: bodyEducational(input),
    cta: buildWhatsappCta(brand),
    hashtags,
    fullText: "",
  };
  versionB.fullText = `${versionB.hook}\n\n${versionB.body}\n\n${versionB.cta}\n\n${versionB.hashtags}`;

  return [versionA, versionB];
}
