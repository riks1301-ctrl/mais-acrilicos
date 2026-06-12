import { ImageCard } from "@/components/ui/Card";
import { Section } from "@/components/ui/Section";
import { segments } from "@/lib/content/segments";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ title: "Segmentos", description: "Comunicação visual para supermercados, farmácias e varejo.", url: "/segmentos" });

export default function SegmentosPage() {
  return (
    <>
      <div className="gradient-hero pt-32 pb-16"><div className="mx-auto max-w-7xl px-4 lg:px-8"><h1 className="text-4xl font-bold text-white">Segmentos Atendidos</h1></div></div>
      <Section><div className="grid gap-8 sm:grid-cols-2">{segments.map((s) => <ImageCard key={s.slug} title={s.name} description={s.shortDesc} image={s.image} href={`/segmentos/${s.slug}`} />)}</div></Section>
    </>
  );
}
