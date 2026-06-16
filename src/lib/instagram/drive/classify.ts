import type { IgImageCategory } from "@prisma/client";

/** Clientes conhecidos — detectados pelo caminho da pasta/arquivo. */
export const KNOWN_CLIENTS = [
  "Condor",
  "Daiken",
  "Smartbus",
  "Fibersul",
  "Carrefour",
  "Extra",
  "Assaí",
  "Atacadão",
  "Pão de Açúcar",
  "Makro",
  "Sams",
  "Walmart",
  "Mercado",
  "Supermercado",
] as const;

type CategoryRule = { pattern: RegExp; category: IgImageCategory };

const PATH_CATEGORY_RULES: CategoryRule[] = [
  { pattern: /display\s*(de\s*)?(mesa|expositor|ch[aã]o|balc[aã]o)|\bdisplay\b/i, category: "DISPLAY" },
  { pattern: /\bpdv\b|ponto\s*de\s*venda|g[oô]ndola|testeira|stopper/i, category: "PDV" },
  { pattern: /letras?\s*caixa|letra\s*caixa|channel\s*letter/i, category: "LETRAS_CAIXA" },
  { pattern: /\btotem\b|tot[eé]m/i, category: "TOTEM" },
  { pattern: /luminoso|letreiro\s*luminoso|neon/i, category: "LUMINOSO" },
  { pattern: /fachada|frente\s*de\s*loja/i, category: "FACHADA" },
  { pattern: /\bbanner\b|faixa/i, category: "BANNER" },
  { pattern: /adesivo|vinil|plotagem/i, category: "ADESIVO" },
  { pattern: /acr[ií]lico/i, category: "ACRILICO" },
  { pattern: /bastidor|produ[cç][aã]o|f[aá]brica/i, category: "BASTIDORES" },
  { pattern: /antes\s*[/\-]?\s*depois/i, category: "ANTES_DEPOIS" },
  { pattern: /obra\s*pronta|instalad|entrega/i, category: "OBRA_PRONTA" },
];

const FOLDER_TO_CATEGORY: Record<string, IgImageCategory> = {
  obras: "OBRA_PRONTA",
  "obra pronta": "OBRA_PRONTA",
  "obras prontas": "OBRA_PRONTA",
  bastidores: "BASTIDORES",
  acrilico: "ACRILICO",
  acrilicos: "ACRILICO",
  display: "DISPLAY",
  displays: "DISPLAY",
  "display de mesa": "DISPLAY",
  "display expositor": "DISPLAY",
  "display de chao": "DISPLAY",
  fachada: "FACHADA",
  fachadas: "FACHADA",
  banner: "BANNER",
  banners: "BANNER",
  adesivo: "ADESIVO",
  adesivos: "ADESIVO",
  luminoso: "LUMINOSO",
  luminosos: "LUMINOSO",
  pdv: "PDV",
  totem: "TOTEM",
  totens: "TOTEM",
  "letras caixa": "LETRAS_CAIXA",
  "letra caixa": "LETRAS_CAIXA",
  "antes depois": "ANTES_DEPOIS",
  "antes/depois": "ANTES_DEPOIS",
};

export function folderToCategory(folderName: string): IgImageCategory | null {
  const key = folderName.trim().toLowerCase();
  return FOLDER_TO_CATEGORY[key] ?? null;
}

/** Categoriza pelo caminho completo (pastas + nome do arquivo). */
export function detectCategoryFromPath(relativePath: string, filename: string): IgImageCategory | null {
  const haystack = `${relativePath}/${filename}`.replace(/\\/g, "/");

  for (const rule of PATH_CATEGORY_RULES) {
    if (rule.pattern.test(haystack)) return rule.category;
  }

  const segments = haystack.split("/").filter(Boolean);
  for (let i = segments.length - 1; i >= 0; i--) {
    const fromFolder = folderToCategory(segments[i]);
    if (fromFolder) return fromFolder;
  }

  return null;
}

export function detectClientFromPath(relativePath: string, filename: string): string | null {
  const haystack = `${relativePath}/${filename}`.replace(/\\/g, "/").toLowerCase();

  for (const client of KNOWN_CLIENTS) {
    if (haystack.includes(client.toLowerCase())) return client;
  }

  return null;
}

export function splitDrivePath(relativePath: string): { mainFolder: string | null; subfolder: string | null } {
  const normalized = relativePath.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
  if (!normalized) return { mainFolder: null, subfolder: null };
  const parts = normalized.split("/");
  if (parts.length === 1) return { mainFolder: parts[0], subfolder: null };
  return { mainFolder: parts[0], subfolder: parts.slice(1).join("/") };
}

/** Palavras-chave do post → categorias e clientes para seleção automática. */
export function themesFromPostText(title: string, idea?: string | null): {
  categories: IgImageCategory[];
  clients: string[];
} {
  const text = `${title} ${idea ?? ""}`.toLowerCase();
  const categories = new Set<IgImageCategory>();
  const clients = new Set<string>();

  for (const rule of PATH_CATEGORY_RULES) {
    if (rule.pattern.test(text)) categories.add(rule.category);
  }

  if (/supermercado|mercado|varejo|g[oô]ndola/i.test(text)) categories.add("PDV");
  if (/display|expositor/i.test(text)) categories.add("DISPLAY");

  for (const client of KNOWN_CLIENTS) {
    if (text.includes(client.toLowerCase())) clients.add(client);
  }

  return { categories: Array.from(categories), clients: Array.from(clients) };
}
