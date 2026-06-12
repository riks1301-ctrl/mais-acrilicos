export const products = [
  {
    name: "Displays de Acrílico",
    slug: "displays-acrilico",
    shortDesc: "Expositores personalizados com acabamento premium para PDV.",
    description:
      "Nossos displays de acrílico são fabricados sob medida para destacar seus produtos no ponto de venda. Utilizamos acrílico cristal, colorido e espelhado com acabamentos como polimento diamantado, dobra a quente e silk screen. Ideais para balcões, gôndolas, vitrines e áreas de checkout.",
    features: [
      "Acrílico cristal, colorido e espelhado",
      "Dobra a quente e colagem UV",
      "Silk screen e impressão digital",
      "Projetos personalizados sob medida",
      "Produção em qualquer quantidade",
    ],
    image:
      "https://images.unsplash.com/photo-1607083206869-4c6672a72fae?w=1200&q=80",
    segment: "pdv",
    featured: true,
    metaTitle: "Displays de Acrílico Personalizados | Mais Acrílicos",
    metaDescription:
      "Fabricante de displays de acrílico para PDV. Expositores personalizados com acabamento premium. Orçamento gratuito.",
  },
  {
    name: "Luminosos",
    slug: "luminosos",
    shortDesc: "Letreiros e caixas de luz LED para fachadas comerciais.",
    description:
      "Produzimos luminosos de alto impacto visual com tecnologia LED de baixo consumo e longa durabilidade. Caixas de luz, letreiros luminosos e painéis backlight para fachadas de lojas, supermercados e farmácias.",
    features: [
      "Tecnologia LED de última geração",
      "Baixo consumo energético",
      "Resistente a intempéries",
      "Instalação profissional",
      "Garantia estendida",
    ],
    image:
      "https://images.unsplash.com/photo-1517048676732-65d794618b66?w=1200&q=80",
    segment: "fachada",
    featured: true,
    metaTitle: "Luminosos e Letreiros LED | Mais Acrílicos",
    metaDescription:
      "Fabricante de luminosos e letreiros LED para fachadas comerciais. Alta durabilidade e impacto visual.",
  },
  {
    name: "Letras Caixa",
    slug: "letras-caixa",
    shortDesc: "Letras 3D em acrílico e LED para fachadas de alto padrão.",
    description:
      "Letras caixa em acrílico com e sem iluminação LED interna. Acabamentos em alto relevo, pintura automotiva e aplicação de vinil. Perfeitas para fachadas comerciais que exigem elegância e visibilidade.",
    features: [
      "Acrílico com iluminação LED",
      "Alto relevo e pintura automotiva",
      "Diversos tamanhos e fontes",
      "Instalação em altura",
      "Projeto 3D incluso",
    ],
    image:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80",
    segment: "fachada",
    featured: true,
    metaTitle: "Letras Caixa em Acrílico e LED | Mais Acrílicos",
    metaDescription:
      "Letras caixa personalizadas em acrílico e LED. Fachadas comerciais com acabamento premium.",
  },
  {
    name: "Fachadas",
    slug: "fachadas",
    shortDesc: "Projetos completos de fachada comercial personalizada.",
    description:
      "Desenvolvemos projetos integrados de fachada comercial combinando ACM, acrílico, letras caixa e luminosos. Do conceito à instalação, entregamos fachadas que fortalecem a identidade visual da sua marca.",
    features: [
      "Projeto arquitetônico completo",
      "ACM, acrílico e estruturas metálicas",
      "Integração com luminosos e letras",
      "Aprovação em órgãos reguladores",
      "Manutenção programada",
    ],
    image:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80",
    segment: "fachada",
    featured: true,
    metaTitle: "Fachadas Comerciais Personalizadas | Mais Acrílicos",
    metaDescription:
      "Projetos de fachada comercial com ACM, acrílico e luminosos. Do projeto à instalação.",
  },
  {
    name: "Material de PDV",
    slug: "material-pdv",
    shortDesc: "Testeiras, wobblers, displays de chão e sinalização para PDV.",
    description:
      "Linha completa de materiais de ponto de venda: testeiras de gôndola, wobblers, displays de chão, porta-folhetos, organizadores e sinalização interna. Tudo personalizado com a identidade visual da sua marca.",
    features: [
      "Testeiras e stopers de gôndola",
      "Wobblers e mobiles",
      "Displays de chão e balcão",
      "Sinalização interna",
      "Campanhas sazonais",
    ],
    image:
      "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=1200&q=80",
    segment: "pdv",
    featured: false,
    metaTitle: "Material de PDV Personalizado | Mais Acrílicos",
    metaDescription:
      "Material de PDV: testeiras, wobblers, displays e sinalização personalizada para varejo.",
  },
];

export function getProduct(slug: string) {
  return products.find((p) => p.slug === slug);
}
