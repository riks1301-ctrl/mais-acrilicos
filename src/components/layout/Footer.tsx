import { siteConfig } from "@/lib/config";
import { Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-surface-dark text-white">
      <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-xl font-bold">MA</div>
              <div><span className="block text-xl font-bold">Mais Acrílicos</span><span className="text-sm text-slate-400">Comunicação Visual & PDV</span></div>
            </div>
            <p className="mt-4 max-w-sm text-slate-400">Fabricante premium de displays, luminosos, fachadas e materiais de PDV.</p>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase text-brand-400">Links</h3>
            {siteConfig.nav.map((l) => <Link key={l.href} href={l.href} className="block py-1 text-sm text-slate-400 hover:text-white">{l.label}</Link>)}
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase text-brand-400">Contato</h3>
            <p className="flex gap-2 text-sm text-slate-400"><Phone className="h-4 w-4" />{siteConfig.phone}</p>
            <p className="mt-2 flex gap-2 text-sm text-slate-400"><Mail className="h-4 w-4" />{siteConfig.email}</p>
            <p className="mt-2 flex gap-2 text-sm text-slate-400"><MapPin className="h-4 w-4" />{siteConfig.address}</p>
          </div>
        </div>
        <p className="mt-12 border-t border-white/10 pt-8 text-center text-sm text-slate-500">© {new Date().getFullYear()} Mais Acrílicos · www.maisacrilicos.com.br</p>
      </div>
    </footer>
  );
}
