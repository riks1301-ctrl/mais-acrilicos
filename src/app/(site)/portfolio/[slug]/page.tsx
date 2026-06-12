import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { portfolioItems } from "@/lib/content/portfolio";
import { buildMetadata } from "@/lib/seo";
import Image from "next/image";
import { notFound } from "next/navigation";

export function generateStaticParams() { return portfolioItems.map((i) => ({ slug: i.slug })); }
export function generateMetadata({ params }: { params: { slug: string } }) {
  const i = portfolioItems.find((x) => x.slug === params.slug);
  return i ? buildMetadata({ title: i.title, description: i.description, url: `/portfolio/${i.slug}`, image: i.image }) : {};
}

export default function PortfolioItemPage({ params }: { params: { slug: string } }) {
  const item = portfolioItems.find((i) => i.slug === params.slug);
  if (!item) notFound();
  return (
    <>
      <div className="gradient-hero pt-32 pb-16"><div className="mx-auto max-w-7xl px-4 lg:px-8"><h1 className="text-4xl font-bold text-white">{item.title}</h1></div></div>
      <Section>
        <div className="mx-auto max-w-4xl">
          <div className="relative aspect-[16/9] overflow-hidden rounded-2xl"><Image src={item.image} alt={item.title} fill className="object-cover" priority sizes="896px" /></div>
          <p className="mt-8 text-lg text-slate-600">{item.description}</p>
          <Button href="/contato" size="lg" className="mt-8">Quero um projeto como este</Button>
        </div>
      </Section>
    </>
  );
}
