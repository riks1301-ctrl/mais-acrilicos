export const segments = [
  {
    name: "Supermercados",
    slug: "supermercados",
    shortDesc: "Comunicação visual completa para supermercados e hipermercados.",
    description:
      "Desenvolvemos soluções integradas de comunicação visual para supermercados: displays para gôndola, hortifruti, açougue, padaria e áreas de checkout. Testeiras personalizadas, sinalização de preços e materiais de PDV que aumentam as vendas e organizam o espaço.",
    benefits: [
      "Displays para todas as seções",
      "Testeiras e stopers de gôndola",
      "Sinalização de preços e promoções",
      "Material para hortifruti e açougue",
      "Campanhas sazonais personalizadas",
    ],
    image:
      "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=1200&q=80",
    featured: true,
    metaTitle: "Comunicação Visual para Supermercados | Mais Acrílicos",
    metaDescription:
      "Soluções de comunicação visual e PDV para supermercados. Displays, testeiras e sinalização personalizada.",
  },
  {
    name: "Farmácias",
    slug: "farmacias",
    shortDesc: "Expositores e sinalização especializada para farmácias e drogarias.",
    description:
      "Comunicação visual especializada para farmácias e drogarias: expositores para balcão, perfumaria e área de medicamentos. Sinalização regulatória, displays para campanhas de laboratório e materiais que transmitem confiança e profissionalismo.",
    benefits: [
      "Expositores para balcão e perfumaria",
      "Sinalização regulatória ANVISA",
      "Displays para campanhas de laboratório",
      "Organizadores de medicamentos",
      "Comunicação visual premium",
    ],
    image:
      "https://images.unsplash.com/photo-1576602973669-2b34cbcb8172?w=1200&q=80",
    featured: true,
    metaTitle: "Comunicação Visual para Farmácias | Mais Acrílicos",
    metaDescription:
      "Comunicação visual e displays para farmácias. Expositores, sinalização e material de PDV especializado.",
  },
  {
    name: "Varejo",
    slug: "varejo",
    shortDesc: "Soluções de PDV para lojas de todos os portes e segmentos.",
    description:
      "Atendemos o varejo em geral com soluções personalizadas de comunicação visual: displays de vitrine, expositores de balcão, sinalização interna e materiais de PDV que destacam produtos e fortalecem a experiência de compra.",
    benefits: [
      "Displays de vitrine e balcão",
      "Sinalização interna personalizada",
      "Materiais para campanhas",
      "Projetos sob medida",
      "Atendimento consultivo",
    ],
    image:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80",
    featured: true,
    metaTitle: "Comunicação Visual para Varejo | Mais Acrílicos",
    metaDescription:
      "Comunicação visual e PDV para varejo. Displays, sinalização e materiais personalizados.",
  },
  {
    name: "Alimentação",
    slug: "alimentacao",
    shortDesc: "Displays e sinalização para restaurantes, buffets e food service.",
    description:
      "Soluções em acrílico para o setor de alimentação: displays para buffet, cardápios, vitrines de confeitaria, protetores de alimentos e sinalização para áreas de self-service. Materiais atóxicos e fáceis de higienizar.",
    benefits: [
      "Displays para buffet e vitrine",
      "Cardápios e porta-cardápios",
      "Protetores de alimentos",
      "Sinalização de self-service",
      "Materiais atóxicos e higiênicos",
    ],
    image:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80",
    featured: false,
    metaTitle: "Comunicação Visual para Alimentação | Mais Acrílicos",
    metaDescription:
      "Displays e sinalização para restaurantes e food service. Materiais atóxicos e personalizados.",
  },
];

export function getSegment(slug: string) {
  return segments.find((s) => s.slug === slug);
}
