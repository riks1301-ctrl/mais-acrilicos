import { QuoteForm } from "@/components/forms/QuoteForm";
import { Section } from "@/components/ui/Section";
import { siteConfig } from "@/lib/config";
import { buildMetadata } from "@/lib/seo";
import { Mail, MapPin, Phone } from "lucide-react";

export const metadata = buildMetadata({ title: "Contato", description: "Solicite orçamento gratuito para comunicação visual e PDV.", url: "/contato" });

export default function ContatoPage() {
  return (
    <>
      <div className="gradient-hero pt-32 pb-16"><div className="mx-auto max-w-7xl px-4 lg:px-8"><h1 className="text-4xl font-bold text-white">Fale Conosco</h1></div></div>
      <Section>
        <div className="grid gap-12 lg:grid-cols-5">
          <div className="lg:col-span-2 space-y-6">
            {[{ icon: Phone, label: "Telefone", value: siteConfig.phone }, { icon: Mail, label: "E-mail", value: siteConfig.email }, { icon: MapPin, label: "Endereço", value: siteConfig.address }].map((c) => (
              <div key={c.label} className="flex gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50"><c.icon className="h-5 w-5 text-brand-600" /></div><div><p className="text-sm text-slate-500">{c.label}</p><p className="font-medium">{c.value}</p></div></div>
            ))}
          </div>
          <div className="rounded-2xl bg-white p-8 shadow-card lg:col-span-3"><h2 className="mb-6 text-2xl font-bold">Solicitar Orçamento</h2><QuoteForm /></div>
        </div>
      </Section>
    </>
  );
}
