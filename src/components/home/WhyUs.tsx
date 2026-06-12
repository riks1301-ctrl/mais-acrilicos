import { Section, SectionHeader } from "@/components/ui/Section";
import { Factory, Headphones, Palette, Truck } from "lucide-react";

const features = [
  { icon: Factory, title: "Produção Própria", description: "Controle total de qualidade e prazos." },
  { icon: Palette, title: "Design Personalizado", description: "Projetos exclusivos com render 3D." },
  { icon: Truck, title: "Entrega Nacional", description: "Envio para todo o Brasil." },
  { icon: Headphones, title: "Suporte Completo", description: "Do orçamento à instalação." },
];

export function WhyUs() {
  return (
    <Section className="bg-surface-muted">
      <SectionHeader badge="Por que a Mais Acrílicos?" title="Qualidade que faz a diferença no PDV" />
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <div key={f.title} className="rounded-2xl bg-white p-8 shadow-card">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-brand-50"><f.icon className="h-7 w-7 text-brand-600" /></div>
            <h3 className="text-lg font-bold">{f.title}</h3>
            <p className="mt-2 text-slate-600">{f.description}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
