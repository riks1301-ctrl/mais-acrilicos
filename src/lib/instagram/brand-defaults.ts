import type { Prisma } from "@prisma/client";

export const DEFAULT_BRAND_CONFIG: Omit<Prisma.InstagramBrandConfigCreateInput, "personas"> = {
  companyName: "Mais Acrílicos",
  instagramHandle: "maisacrilico",
  segment: "Comunicação visual e PDV",
  tone: "Profissional, direto, vendedor, moderno e confiável",
  mainCta: "Chame no WhatsApp e peça seu orçamento",
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP || "5541987675762",
  targetAudience: [
    "Mercados e supermercados",
    "Farmácias",
    "Lojas de varejo",
    "Imobiliárias",
    "Indústrias",
    "Restaurantes e açougues",
    "Eventos",
    "Comércios locais",
  ],
  differentials: [
    "Produção sob medida",
    "Acabamento profissional",
    "Soluções para vender mais no ponto de venda",
    "Atendimento consultivo",
    "Prazo e qualidade",
  ],
  primaryHashtags: [
    "#comunicacaovisual",
    "#pdv",
    "#displays",
    "#acrílico",
    "#fachada",
    "#luminoso",
    "#adesivos",
    "#sinalizacao",
    "#varejo",
    "#pontodevenda",
  ],
  localHashtags: [
    "#saopaulo",
    "#sp",
    "#comunicacaovisualsp",
    "#graficasp",
    "#fabricantesp",
  ],
  brandColors: {
    primary: "#0369a1",
    secondary: "#0ea5e9",
    accent: "#f59e0b",
    background: "#f8fafc",
    text: "#0f172a",
  },
  brandFonts: {
    heading: "Arial, Helvetica, sans-serif",
    body: "Arial, Helvetica, sans-serif",
  },
  artTemplateSet: "carousel",
  visualGuidelines: [
    "Fotos reais de produção sempre que possível",
    "Mockups e conceitos devem ser marcados como tal",
    "Texto curto, legível e comercial",
    "Destaque para benefício e CTA de WhatsApp",
    "Evitar imagens genéricas sem contexto de PDV",
  ].join("\n"),
  publicationMode: "MANUAL",
  metaConnected: false,
};

export const DEFAULT_PERSONAS: Omit<Prisma.InstagramPersonaCreateWithoutBrandConfigInput, "id">[] = [
  {
    name: "Gerente de mercado",
    description: "Responsável por aumentar vendas de categorias e destacar ofertas no PDV.",
    painPoints: ["Baixa visibilidade de promoções", "Displays desorganizados", "Concorrência agressiva"],
    goals: ["Aumentar ticket médio", "Destacar ofertas", "Profissionalizar o PDV"],
    segments: ["Mercados", "Supermercados"],
  },
  {
    name: "Proprietário de farmácia",
    description: "Busca transmitir confiança e destacar produtos de margem no balcão.",
    painPoints: ["Falta de padronização visual", "Sinalização fraca", "Dificuldade em comunicar ofertas"],
    goals: ["Passar credibilidade", "Organizar exposição", "Vender mais no balcão"],
    segments: ["Farmácias"],
  },
  {
    name: "Lojista de varejo",
    description: "Quer loja bonita, organizada e que converta visitantes em compradores.",
    painPoints: ["Vitrine sem destaque", "Materiais amadores", "Baixa percepção de valor"],
    goals: ["Valorizar produtos", "Atrair clientes", "Diferenciar da concorrência"],
    segments: ["Lojas", "Comércio local"],
  },
  {
    name: "Corretor / imobiliária",
    description: "Precisa de placas, totens e materiais que gerem autoridade e leads.",
    painPoints: ["Placas sem padrão", "Baixa visibilidade na rua", "Materiais genéricos"],
    goals: ["Gerar mais contatos", "Transmitir profissionalismo", "Destacar imóveis"],
    segments: ["Imobiliárias"],
  },
];

export const EXAMPLE_POST_IDEAS = [
  "5 ideias de comunicação visual para mercado vender mais",
  "Display de acrílico sob medida para destacar seu produto",
  "Você está perdendo vendas por não sinalizar bem sua loja",
  "Antes e depois de uma fachada bem feita",
  "Materiais que deixam seu PDV mais profissional",
  "Como um expositor certo aumenta a percepção de valor",
  "Comunicação visual não é gasto, é vendedor silencioso",
];
