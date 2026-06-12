import type { IgContentType, IgPostFormat } from "@prisma/client";
import { WEEKLY_THEMES } from "@/lib/instagram/constants";
import type { BrandContext, GeneratedIdea } from "@/lib/instagram/types";
import { pickPersona, pickRandom, pickSegment, pickService } from "./context";

type IdeaTemplate = {
  contentType: IgContentType;
  format: IgPostFormat;
  titles: ((ctx: TemplateCtx) => string)[];
  ideas: ((ctx: TemplateCtx) => string)[];
};

type TemplateCtx = {
  brand: BrandContext;
  segment: string;
  service: { name: string; description: string };
  differential: string;
  personaName: string;
};

function ctx(brand: BrandContext): TemplateCtx {
  const persona = pickPersona(brand);
  return {
    brand,
    segment: pickSegment(brand),
    service: pickService(brand),
    differential: pickRandom(brand.differentials),
    personaName: persona?.name ?? "lojista",
  };
}

const TEMPLATES: IdeaTemplate[] = [
  {
    contentType: "RETAIL_TIPS",
    format: "CAROUSEL",
    titles: [
      (c) => `5 ideias de comunicação visual para ${c.segment} vender mais`,
      () => `Você está perdendo vendas por não sinalizar bem sua loja`,
      () => `Como um expositor certo aumenta a percepção de valor`,
      (c) => `Dicas de PDV que ${c.personaName} precisa aplicar hoje`,
    ],
    ideas: [
      (c) => `Carrossel educativo com 5 dicas práticas de sinalização e exposição para ${c.segment}. Foco em aumentar conversão no balcão e gôndola. Destacar ${c.differential}.`,
      (c) => `Post que mostra o custo de uma loja mal sinalizada vs. loja profissional. Gancho de perda de vendas silenciosa. Solução: comunicação visual da ${c.brand.companyName}.`,
    ],
  },
  {
    contentType: "PRODUCT_SHOWCASE",
    format: "FEED",
    titles: [
      () => `Display de acrílico sob medida para destacar seu produto`,
      (c) => `${c.service.name}: acabamento que valoriza sua marca`,
      (c) => `Solução em ${c.service.name} para ${c.segment}`,
    ],
    ideas: [
      (c) => `Mostrar ${c.service.name} em uso real ou mockup marcado como conceito. Benefício: destaque no PDV + ${c.differential}. Ideal para ${c.segment}.`,
    ],
  },
  {
    contentType: "BEHIND_SCENES",
    format: "REELS",
    titles: [
      (c) => `Bastidores: como produzimos seu ${c.service.name}`,
      () => `Da matéria-prima ao PDV — veja nossa produção`,
      (c) => `Por dentro da fábrica da ${c.brand.companyName}`,
    ],
    ideas: [
      (c) => `Reels curto mostrando corte, acabamento e montagem. Tom autêntico, ritmo dinâmico. Reforçar ${c.differential} e convidar para orçamento.`,
    ],
  },
  {
    contentType: "BEFORE_AFTER",
    format: "CAROUSEL",
    titles: [
      () => `Antes e depois de uma fachada bem feita`,
      (c) => `Transformação real no PDV de um ${c.segment}`,
      () => `O que muda quando a sinalização fica profissional`,
    ],
    ideas: [
      (c) => `Carrossel 2-3 slides: antes (problema) → depois (solução ${c.brand.companyName}). Prova visual de resultado. Ideal para ${c.personaName}.`,
    ],
  },
  {
    contentType: "DIRECT_OFFER",
    format: "FEED",
    titles: [
      (c) => `Orçamento de ${c.service.name} sob medida`,
      () => `Sinalize sua loja e venda mais — fale conosco`,
      (c) => `Produção rápida de materiais para ${c.segment}`,
    ],
    ideas: [
      (c) => `Oferta direta com urgência moderada. Benefício claro + ${c.brand.mainCta}. Mencionar ${c.differential}.`,
    ],
  },
  {
    contentType: "EDUCATIONAL_CAROUSEL",
    format: "CAROUSEL",
    titles: [
      () => `Materiais que deixam seu PDV mais profissional`,
      () => `Acrílico vs. outros materiais: qual escolher?`,
      () => `Comunicação visual não é gasto, é vendedor silencioso`,
    ],
    ideas: [
      (c) => `Carrossel comparativo ou educativo. Explicar benefícios de cada material/solução. Posicionar ${c.brand.companyName} como especialista.`,
    ],
  },
  {
    contentType: "MATERIAL_COMPARISON",
    format: "CAROUSEL",
    titles: [
      () => `Comparação: acrílico, PVC e metal no PDV`,
      () => `Qual material dura mais na sua fachada?`,
    ],
    ideas: [
      (c) => `Slides comparando custo-benefício, durabilidade e impacto visual. Ajuda o ${c.personaName} a decidir.`,
    ],
  },
  {
    contentType: "PDV_IDEAS",
    format: "CAROUSEL",
    titles: [
      (c) => `Ideias de PDV para ${c.segment} aumentar vendas`,
      () => `3 formas de destacar promoções no balcão`,
    ],
    ideas: [
      (c) => `Inspiração visual com ideias aplicáveis. Cada slide uma dica + exemplo de produto ${c.brand.companyName}.`,
    ],
  },
  {
    contentType: "SOCIAL_PROOF",
    format: "FEED",
    titles: [
      (c) => `Projeto entregue para ${c.segment} em São Paulo`,
      (c) => `Cliente satisfeito com ${c.service.name}`,
    ],
    ideas: [
      () => `Foto real do projeto + breve contexto do desafio e resultado. Pedir depoimento ou usar quote fictício apenas se marcado como ilustrativo.`,
    ],
  },
  {
    contentType: "REELS_PRODUCTION",
    format: "REELS",
    titles: [
      (c) => `Veja esse ${c.service.name} sendo finalizado`,
      () => `Satisfação de ver o projeto pronto`,
    ],
    ideas: [
      () => `Reels leve, música trending, foco visual na produção. CTA no final para WhatsApp.`,
    ],
  },
  {
    contentType: "PRODUCT_CATALOG",
    format: "CAROUSEL",
    titles: [
      (c) => `Catálogo: soluções em comunicação visual para ${c.segment}`,
      (c) => `O que a ${c.brand.companyName} produz para o seu negócio`,
    ],
    ideas: [
      () => `Variedade de produtos/serviços em slides. Institucional mas comercial. Fechar com CTA.`,
    ],
  },
  {
    contentType: "SEASONAL",
    format: "FEED",
    titles: [
      () => `Prepare seu PDV para a próxima data comercial`,
      () => `Sinalização sazonal que atrai mais clientes`,
    ],
    ideas: [
      () => `Conectar com data comercial próxima (Dia das Mães, Black Friday, etc.). Urgência + solução sob medida.`,
    ],
  },
];

export function generateIdea(brand: BrandContext, contentType?: IgContentType): GeneratedIdea {
  const pool = contentType ? TEMPLATES.filter((t) => t.contentType === contentType) : TEMPLATES;
  const template = pickRandom(pool.length ? pool : TEMPLATES);
  const c = ctx(brand);
  const title = pickRandom(template.titles)(c);
  const idea = pickRandom(template.ideas)(c);

  return {
    title,
    idea,
    contentType: template.contentType,
    format: template.format,
    suggestedPersona: c.personaName,
  };
}

export function generateIdeas(brand: BrandContext, count: number, contentType?: IgContentType): GeneratedIdea[] {
  const ideas: GeneratedIdea[] = [];
  const usedTitles = new Set<string>();

  for (let i = 0; i < count; i++) {
    let attempt = 0;
    let idea: GeneratedIdea;
    do {
      idea = generateIdea(brand, contentType);
      attempt++;
    } while (usedTitles.has(idea.title) && attempt < 10);
    usedTitles.add(idea.title);
    ideas.push(idea);
  }

  return ideas;
}

export function generateIdeaForDay(brand: BrandContext, dayOfWeek: number): GeneratedIdea {
  const theme = WEEKLY_THEMES.find((d) => d.day === dayOfWeek) ?? WEEKLY_THEMES[0];
  return generateIdea(brand, theme.contentType);
}
