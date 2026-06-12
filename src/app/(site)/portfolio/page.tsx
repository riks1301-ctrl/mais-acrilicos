import { ImageCard } from "@/components/ui/Card";
import { Section } from "@/components/ui/Section";
import { portfolioItems } from "@/lib/content/portfolio";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ title: "Portfólio", description: "Projetos de comunicação visual realizados pela Mais Acrílicos.", url: "/portfolio" });

export default function PortfolioPage() {
  return (
    <>
      <div className="gradient-hero pt-32 pb-16"><div className="mx-auto max-w-7xl px-4 lg:px-8"><h1 className="text-4xl font-bold text-white">Portfólio</h1></div></div>
      <Section><div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">{portfolioItems.map((i) => <ImageCard key={i.slug} title={i.title} description={i.description} image={i.image} href={`/portfolio/${i.slug}`} tag={i.segment} />)}</div></Section>
    </>
  );
}
