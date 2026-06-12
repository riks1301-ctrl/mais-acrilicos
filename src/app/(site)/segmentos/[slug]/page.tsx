import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { getSegment, segments } from "@/lib/content/segments";
import { buildMetadata } from "@/lib/seo";
import { CheckCircle } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";

export function generateStaticParams() { return segments.map((s) => ({ slug: s.slug })); }
export function generateMetadata({ params }: { params: { slug: string } }) {
  const s = getSegment(params.slug);
  return s ? buildMetadata({ title: s.metaTitle || s.name, description: s.metaDescription, url: `/segmentos/${s.slug}` }) : {};
}

export default function SegmentPage({ params }: { params: { slug: string } }) {
  const segment = getSegment(params.slug);
  if (!segment) notFound();
  return (
    <>
      <div className="gradient-hero pt-32 pb-16"><div className="mx-auto max-w-7xl px-4 lg:px-8"><h1 className="text-4xl font-bold text-white">{segment.name}</h1></div></div>
      <Section>
        <div className="grid gap-12 lg:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl"><Image src={segment.image} alt={segment.name} fill className="object-cover" sizes="50vw" /></div>
          <div>
            <p className="text-lg text-slate-600">{segment.description}</p>
            <ul className="mt-6 space-y-3">{segment.benefits.map((b) => <li key={b} className="flex gap-3"><CheckCircle className="h-5 w-5 text-brand-600" />{b}</li>)}</ul>
            <Button href="/contato" size="lg" className="mt-8">Solicitar Orçamento</Button>
          </div>
        </div>
      </Section>
    </>
  );
}
