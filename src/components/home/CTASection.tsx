import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { siteConfig } from "@/lib/config";
import { ArrowRight, Phone } from "lucide-react";

export function CTASection() {
  return (
    <Section className="relative overflow-hidden">
      <div className="absolute inset-0 gradient-hero opacity-95" />
      <div className="relative text-center">
        <h2 className="text-3xl font-bold text-white md:text-5xl">Pronto para transformar sua comunicação visual?</h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">Solicite um orçamento gratuito e receba consultoria personalizada.</p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button href="/contato" size="lg" variant="secondary">Solicitar Orçamento <ArrowRight className="h-5 w-5" /></Button>
          <a href={`tel:${siteConfig.phone.replace(/\D/g, "")}`} className="inline-flex items-center gap-2 rounded-xl border-2 border-white/30 px-8 py-4 text-lg font-semibold text-white hover:bg-white hover:text-brand-900"><Phone className="h-5 w-5" />{siteConfig.phone}</a>
        </div>
      </div>
    </Section>
  );
}
