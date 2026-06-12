import { ImageCard } from "@/components/ui/Card";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";

const products = [
  { title: "Displays de Acrílico", description: "Expositores personalizados para balcão e gôndola.", image: "https://images.unsplash.com/photo-1607083206869-4c6672a72fae?w=800&q=80", href: "/produtos/displays-acrilico", tag: "Mais vendido" },
  { title: "Luminosos", description: "Letreiros e caixas de luz LED para fachadas.", image: "https://images.unsplash.com/photo-1517048676732-65d794618b66?w=800&q=80", href: "/produtos/luminosos" },
  { title: "Letras Caixa", description: "Letras 3D em acrílico e LED.", image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80", href: "/produtos/letras-caixa" },
  { title: "Fachadas", description: "Projetos completos de fachada comercial.", image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80", href: "/produtos/fachadas" },
  { title: "Material de PDV", description: "Testeiras, wobblers e sinalização.", image: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800&q=80", href: "/produtos/material-pdv" },
  { title: "Comunicação Visual", description: "Soluções integradas para varejo.", image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80", href: "/produtos" },
];

export function ProductsShowcase() {
  return (
    <Section>
      <SectionHeader badge="Nossos Produtos" title="Soluções completas em comunicação visual" subtitle="Fabricamos displays, luminosos, fachadas e materiais de PDV com qualidade premium." />
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">{products.map((p) => <ImageCard key={p.href} {...p} />)}</div>
      <div className="mt-12 text-center"><Button href="/produtos" variant="outline" size="lg">Ver todos os produtos</Button></div>
    </Section>
  );
}
