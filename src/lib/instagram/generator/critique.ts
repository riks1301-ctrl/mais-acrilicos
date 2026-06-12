import type { GeneratedCaption, GeneratedIdea } from "@/lib/instagram/types";
import type { BrandContext } from "@/lib/instagram/types";

type CritiqueInput = {
  brand: BrandContext;
  title: string;
  idea?: string | null;
  captions: GeneratedCaption[];
  format?: string;
};

const GENERIC_CTAS = ["saiba mais", "clique aqui", "link na bio", "confira"];
const GENERIC_PHRASES = [
  "loja mais profissional",
  "produto mais valorizado",
  "cliente comprando com mais confiança",
  "comunicação visual bem feita não é custo",
];

function hasBenefit(text: string): boolean {
  const keywords = ["vende", "venda", "valoriz", "profissional", "destaque", "resultado", "aument", "convers", "pdv", "orçamento"];
  const lower = text.toLowerCase();
  return keywords.some((k) => lower.includes(k));
}

function hasUrgency(text: string): boolean {
  const keywords = ["hoje", "agora", "não perca", "últim", "prepare", "antes de"];
  const lower = text.toLowerCase();
  return keywords.some((k) => lower.includes(k));
}

function hasProof(text: string): boolean {
  const keywords = ["cliente", "projeto", "entregue", "antes e depois", "depoimento", "resultado real", "obras"];
  const lower = text.toLowerCase();
  return keywords.some((k) => lower.includes(k));
}

function ctaIsGeneric(cta: string): boolean {
  const lower = cta.toLowerCase();
  return GENERIC_CTAS.some((g) => lower.includes(g)) && !lower.includes("whatsapp") && !lower.includes("orçamento");
}

export function critiquePost(input: CritiqueInput) {
  const { brand, title, idea, captions } = input;
  const issues: string[] = [];
  const suggestions: string[] = [];
  const strengths: string[] = [];
  let score = 70;

  const primary = captions[0];
  const fullText = captions.map((c) => c.fullText).join(" ");

  // Gancho
  if (!primary?.hook || primary.hook.length < 15) {
    issues.push("Gancho fraco — primeira linha não prende atenção.");
    suggestions.push("Comece com pergunta, alerta ou número (ex: '5 ideias...').");
    score -= 12;
  } else if (primary.hook.length > 10) {
    strengths.push("Gancho presente na abertura.");
    score += 5;
  }

  // CTA WhatsApp
  const hasWhatsappCta = captions.some(
    (c) => c.cta.toLowerCase().includes("whatsapp") || c.cta.toLowerCase().includes("orçamento")
  );
  if (!hasWhatsappCta) {
    issues.push("CTA não direciona claramente para WhatsApp/orçamento.");
    suggestions.push(`Use o CTA da marca: "${brand.mainCta}".`);
    score -= 15;
  } else {
    strengths.push("CTA alinhado com objetivo comercial (WhatsApp).");
    score += 8;
  }

  if (captions.some((c) => ctaIsGeneric(c.cta))) {
    issues.push("CTA genérico detectado em alguma variação.");
    suggestions.push("Substitua 'saiba mais' por ação concreta: peça orçamento no WhatsApp.");
    score -= 8;
  }

  // Benefício
  if (!hasBenefit(fullText)) {
    issues.push("Legenda não deixa benefício claro para o lojista.");
    suggestions.push("Inclua o que o cliente ganha: mais vendas, loja profissional, produto valorizado.");
    score -= 12;
  } else {
    strengths.push("Benefício comercial identificado.");
    score += 6;
  }

  // Prova / urgência
  if (!hasProof(fullText) && !hasUrgency(fullText)) {
    issues.push("Falta prova social ou senso de urgência.");
    suggestions.push("Adicione caso real, antes/depois ou prazo ('prepare seu PDV antes da data X').");
    score -= 8;
  }

  // Título vs ideia
  if (!idea || idea.length < 40) {
    issues.push("Briefing da ideia muito vago para orientar produção.");
    suggestions.push("Detalhe formato visual, público e objetivo do post.");
    score -= 5;
  }

  // Tom da marca
  if (title.length > 80) {
    issues.push("Título longo demais para Instagram.");
    score -= 5;
  }

  // Muito institucional?
  const institutional = ["nossa empresa", "somos especialistas", "há anos no mercado"];
  if (institutional.some((p) => fullText.toLowerCase().includes(p)) && !hasBenefit(fullText)) {
    issues.push("Post mais institucional do que vendedor.");
    suggestions.push("Fale do problema do lojista primeiro, depois da solução.");
    score -= 10;
  }

  const genericCount = GENERIC_PHRASES.filter((p) => fullText.toLowerCase().includes(p)).length;
  if (genericCount >= 2) {
    issues.push("Legenda com frases genéricas repetidas — pouco diferencial.");
    suggestions.push("Inclua serviço específico, segmento ou caso real da Mais Acrílicos.");
    score -= 10;
  }

  if (!fullText.includes("wa.me") && !fullText.match(/\d{10,}/)) {
    suggestions.push("Inclua link wa.me ou número de WhatsApp visível na legenda.");
    score -= 5;
  }

  // Variação A/B
  if (captions.length < 2) {
    suggestions.push("Gere variação B para testar gancho educacional vs. direto.");
  } else {
    strengths.push("Variações A/B disponíveis para teste.");
    score += 4;
  }

  score = Math.max(0, Math.min(100, score));
  const sells = score >= 65 && hasWhatsappCta && hasBenefit(fullText);

  let verdict: string;
  if (score >= 80) verdict = "Post comercial forte — pronto para revisão visual.";
  else if (score >= 65) verdict = "Bom potencial de venda — ajustes leves recomendados.";
  else if (score >= 45) verdict = "Post bonito no conceito, mas fraco para converter.";
  else verdict = "Precisa reescrever — não vende o suficiente.";

  return {
    score,
    sells,
    verdict,
    issues,
    suggestions,
    strengths,
  };
}

export function formatCritiqueText(result: ReturnType<typeof critiquePost>): string {
  const lines = [
    `📊 Score comercial: ${result.score}/100`,
    `Veredito: ${result.verdict}`,
    result.sells ? "✅ Potencial de venda: SIM" : "❌ Potencial de venda: FRACO",
    "",
  ];

  if (result.strengths.length) {
    lines.push("Pontos fortes:", ...result.strengths.map((s) => `  + ${s}`), "");
  }
  if (result.issues.length) {
    lines.push("Problemas:", ...result.issues.map((i) => `  - ${i}`), "");
  }
  if (result.suggestions.length) {
    lines.push("Sugestões:", ...result.suggestions.map((s) => `  → ${s}`));
  }

  return lines.join("\n");
}

export function critiqueFromIdea(brand: BrandContext, idea: GeneratedIdea, captions: GeneratedCaption[]) {
  return critiquePost({
    brand,
    title: idea.title,
    idea: idea.idea,
    captions,
    format: idea.format,
  });
}
