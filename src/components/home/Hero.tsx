import { Button } from "@/components/ui/Button";
import { ArrowRight, Award, Shield, Zap } from "lucide-react";
import Image from "next/image";

export function Hero() {
  return (
    <section className="relative flex min-h-[90vh] items-center overflow-hidden gradient-hero">
      <div className="absolute inset-0 opacity-20">
        <Image src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&q=80" alt="" fill className="object-cover" priority sizes="100vw" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-brand-950/90 via-brand-900/80 to-brand-800/60" />
      <div className="relative mx-auto max-w-7xl px-4 py-32 lg:px-8">
        <div className="max-w-3xl">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-brand-200"><Award className="h-4 w-4" />Referência em Comunicação Visual & PDV</span>
          <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">Soluções Premium em <span className="bg-gradient-to-r from-brand-400 to-brand-200 bg-clip-text text-transparent">Acrílico e PDV</span></h1>
          <p className="mt-6 text-lg text-slate-300 sm:text-xl">Displays, luminosos, fachadas e letras caixa com acabamento de alto padrão para supermercados, farmácias e varejo.</p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Button href="/contato" size="lg" variant="secondary">Solicitar Orçamento <ArrowRight className="h-5 w-5" /></Button>
            <Button href="/portfolio" size="lg" variant="outline" className="border-white/30 text-white hover:bg-white hover:text-brand-900">Ver Portfólio</Button>
          </div>
          <div className="mt-16 grid grid-cols-3 gap-6 border-t border-white/10 pt-8">
            {[{ icon: Shield, label: "Qualidade Premium", value: "100%" }, { icon: Zap, label: "Produção Própria", value: "Rápida" }, { icon: Award, label: "Clientes", value: "500+" }].map((s) => (
              <div key={s.label}><s.icon className="mb-2 h-5 w-5 text-brand-400" /><p className="text-2xl font-bold text-white">{s.value}</p><p className="text-sm text-slate-400">{s.label}</p></div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
