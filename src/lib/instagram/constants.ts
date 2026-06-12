import type { IgContentType, IgPostFormat, IgPostStatus } from "@prisma/client";

export const IG_STATUS_LABELS: Record<IgPostStatus, string> = {
  IDEA: "Ideia",
  CREATING: "Em criação",
  PENDING_APPROVAL: "Aguardando aprovação",
  APPROVED: "Aprovado",
  SCHEDULED: "Agendado",
  PUBLISHED: "Publicado",
  REJECTED: "Reprovado",
  ERROR: "Erro",
};

export const IG_FORMAT_LABELS: Record<IgPostFormat, string> = {
  FEED: "Feed",
  CAROUSEL: "Carrossel",
  STORY: "Story",
  REELS: "Reels",
};

export const IG_CONTENT_TYPE_LABELS: Record<IgContentType, string> = {
  BEFORE_AFTER: "Antes e depois",
  BEHIND_SCENES: "Bastidores",
  PRODUCT_SHOWCASE: "Produto pronto",
  EDUCATIONAL_CAROUSEL: "Carrossel educativo",
  DIRECT_OFFER: "Oferta direta",
  SEASONAL: "Data comercial",
  REELS_PRODUCTION: "Reels de produção",
  RETAIL_TIPS: "Dica para lojistas",
  MATERIAL_COMPARISON: "Comparação de materiais",
  PDV_IDEAS: "Ideias para PDV",
  SOCIAL_PROOF: "Prova social",
  TESTIMONIAL: "Depoimento",
  PRODUCT_CATALOG: "Catálogo visual",
};

export const WEEKLY_THEMES = [
  { day: 1, label: "Segunda", theme: "Dica educativa", contentType: "RETAIL_TIPS" as IgContentType },
  { day: 2, label: "Terça", theme: "Produto/serviço", contentType: "PRODUCT_SHOWCASE" as IgContentType },
  { day: 3, label: "Quarta", theme: "Bastidores", contentType: "BEHIND_SCENES" as IgContentType },
  { day: 4, label: "Quinta", theme: "Prova social / antes e depois", contentType: "BEFORE_AFTER" as IgContentType },
  { day: 5, label: "Sexta", theme: "Oferta direta", contentType: "DIRECT_OFFER" as IgContentType },
  { day: 6, label: "Sábado", theme: "Reels leve ou inspiração", contentType: "REELS_PRODUCTION" as IgContentType },
  { day: 0, label: "Domingo", theme: "Institucional / planejamento", contentType: "PRODUCT_CATALOG" as IgContentType },
];

export const PUBLICATION_CHANNEL_LABELS = {
  FEED: "Instagram Feed",
  STORY: "Story",
  REELS: "Reels",
  CAROUSEL: "Carrossel",
} as const;

export const STATUS_COLORS: Record<IgPostStatus, string> = {
  IDEA: "bg-slate-200 border-slate-300",
  CREATING: "bg-blue-100 border-blue-300",
  PENDING_APPROVAL: "bg-amber-100 border-amber-400",
  APPROVED: "bg-green-100 border-green-400",
  SCHEDULED: "bg-purple-100 border-purple-400",
  PUBLISHED: "bg-brand-100 border-brand-400",
  REJECTED: "bg-red-100 border-red-300",
  ERROR: "bg-red-200 border-red-400",
};

export const IMAGE_FORMATS = [
  { id: "1080x1080", label: "Feed quadrado", ratio: "1:1" },
  { id: "1080x1350", label: "Feed retrato", ratio: "4:5" },
  { id: "1080x1920", label: "Stories / Reels", ratio: "9:16" },
] as const;
