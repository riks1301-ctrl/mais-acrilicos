import { ImageCard } from "@/components/ui/Card";
import { Section } from "@/components/ui/Section";
import { JsonLd } from "@/components/seo/JsonLd";
import { products } from "@/lib/content/products";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";

export const metadata = buildMetadata({ title: "Produtos", description: "Displays de acrílico, luminosos, letras caixa, fachadas e material de PDV.", url: "/produtos" });

export default function ProdutosPage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: "Início", url: "/" }, { name: "Produtos", url: "/produtos" }])} />
      <div className="gradient-hero pt-32 pb-16"><div className="mx-auto max-w-7xl px-4 lg:px-8"><h1 className="text-4xl font-bold text-white md:text-5xl">Nossos Produtos</h1><p className="mt-4 max-w-2xl text-lg text-slate-300">Soluções completas em comunicação visual e PDV.</p></div></div>
      <Section><div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">{products.map((p) => <ImageCard key={p.slug} title={p.name} description={p.shortDesc} image={p.image} href={`/produtos/${p.slug}`} tag={p.featured ? "Destaque" : undefined} />)}</div></Section>
    </>
  );
}
