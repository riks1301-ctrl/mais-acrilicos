import { Section, SectionHeader } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { Building2, Pill, ShoppingBag, Utensils } from "lucide-react";
import Link from "next/link";

const segments = [
  { icon: ShoppingBag, title: "Supermercados", description: "Displays, testeiras e sinalização.", href: "/segmentos/supermercados", color: "bg-emerald-500" },
  { icon: Pill, title: "Farmácias", description: "Expositores e sinalização regulatória.", href: "/segmentos/farmacias", color: "bg-rose-500" },
  { icon: Building2, title: "Varejo", description: "Comunicação visual integrada.", href: "/segmentos/varejo", color: "bg-brand-500" },
  { icon: Utensils, title: "Alimentação", description: "Displays para buffet e vitrines.", href: "/segmentos/alimentacao", color: "bg-amber-500" },
];

export function SegmentsShowcase() {
  return (
    <Section dark>
      <SectionHeader badge="Segmentos" title="Especialistas no seu mercado" subtitle="Soluções sob medida para cada segmento." light />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {segments.map((s) => (
          <Link key={s.href} href={s.href} className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10">
            <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${s.color}`}><s.icon className="h-6 w-6 text-white" /></div>
            <h3 className="text-lg font-bold text-white">{s.title}</h3>
            <p className="mt-2 text-sm text-slate-400">{s.description}</p>
          </Link>
        ))}
      </div>
      <div className="mt-12 text-center"><Button href="/segmentos" variant="secondary" size="lg">Conheça os segmentos</Button></div>
    </Section>
  );
}
