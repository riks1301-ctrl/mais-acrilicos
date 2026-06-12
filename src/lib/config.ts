export const siteConfig = {
  name: "Mais Acrílicos",
  title: "Mais Acrílicos | Comunicação Visual e PDV",
  description:
    "Fabricante premium de displays de acrílico, luminosos, fachadas e materiais de PDV. Soluções em comunicação visual para supermercados, farmácias e varejo.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.maisacrilicos.com.br",
  ogImage: "/og-image.jpg",
  phone: "(11) 99999-9999",
  email: "contato@maisacrilicos.com.br",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP || "5511999999999",
  address: "São Paulo, SP - Brasil",
  social: {
    instagram: "https://instagram.com/maisacrilicos",
    facebook: "https://facebook.com/maisacrilicos",
    linkedin: "https://linkedin.com/company/maisacrilicos",
  },
  nav: [
    { label: "Início", href: "/" },
    { label: "Produtos", href: "/produtos" },
    { label: "Segmentos", href: "/segmentos" },
    { label: "Portfólio", href: "/portfolio" },
    { label: "Blog", href: "/blog" },
    { label: "Contato", href: "/contato" },
  ],
} as const;
