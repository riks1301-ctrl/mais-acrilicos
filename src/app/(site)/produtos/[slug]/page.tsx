import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { JsonLd } from "@/components/seo/JsonLd";
import { getProduct, products } from "@/lib/content/products";
import { buildMetadata, breadcrumbSchema, productSchema } from "@/lib/seo";
import { CheckCircle } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";

export function generateStaticParams() { return products.map((p) => ({ slug: p.slug })); }

export function generateMetadata({ params }: { params: { slug: string } }) {
  const p = getProduct(params.slug);
  if (!p) return {};
  return buildMetadata({ title: p.metaTitle || p.name, description: p.metaDescription || p.shortDesc, url: `/produtos/${p.slug}`, image: p.image });
}

export default function ProductPage({ params }: { params: { slug: string } }) {
  const product = getProduct(params.slug);
  if (!product) notFound();
  return (
    <>
      <JsonLd data={[productSchema(product), breadcrumbSchema([{ name: "Início", url: "/" }, { name: "Produtos", url: "/produtos" }, { name: product.name, url: `/produtos/${product.slug}` }])]} />
      <div className="gradient-hero pt-32 pb-16"><div className="mx-auto max-w-7xl px-4 lg:px-8"><h1 className="text-4xl font-bold text-white">{product.name}</h1><p className="mt-4 text-lg text-slate-300">{product.shortDesc}</p></div></div>
      <Section>
        <div className="grid gap-12 lg:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl"><Image src={product.image} alt={product.name} fill className="object-cover" priority sizes="50vw" /></div>
          <div>
            <p className="text-lg text-slate-600">{product.description}</p>
            <ul className="mt-6 space-y-3">{product.features.map((f) => <li key={f} className="flex gap-3"><CheckCircle className="h-5 w-5 shrink-0 text-brand-600" />{f}</li>)}</ul>
            <Button href="/contato" size="lg" className="mt-8">Solicitar Orçamento</Button>
          </div>
        </div>
      </Section>
    </>
  );
}
