"use client";

import { siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";
import { Menu, Phone, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "../ui/Button";

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className={cn("fixed inset-x-0 top-0 z-50 transition-all", scrolled ? "bg-white/95 shadow-sm backdrop-blur-md" : "bg-transparent")}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 font-bold text-white">MA</div>
          <div className="hidden sm:block">
            <span className={cn("block font-bold", scrolled ? "text-slate-900" : "text-white")}>Mais Acrílicos</span>
            <span className={cn("block text-xs", scrolled ? "text-slate-500" : "text-white/70")}>Comunicação Visual & PDV</span>
          </div>
        </Link>
        <nav className="hidden gap-1 lg:flex">
          {siteConfig.nav.map((item) => (
            <Link key={item.href} href={item.href} className={cn("rounded-lg px-4 py-2 text-sm font-medium", pathname === item.href ? "bg-brand-600 text-white" : scrolled ? "text-slate-700 hover:bg-slate-100" : "text-white/90 hover:bg-white/10")}>{item.label}</Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <a href={`tel:${siteConfig.phone.replace(/\D/g, "")}`} className={cn("flex items-center gap-2 text-sm", scrolled ? "text-slate-600" : "text-white/80")}><Phone className="h-4 w-4" />{siteConfig.phone}</a>
          <Button href="/contato" size="sm">Solicitar Orçamento</Button>
        </div>
        <button className={cn("rounded-lg p-2 lg:hidden", scrolled ? "text-slate-900" : "text-white")} onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X /> : <Menu />}</button>
      </div>
      {open && (
        <div className="border-t bg-white px-4 py-4 lg:hidden">
          {siteConfig.nav.map((item) => <Link key={item.href} href={item.href} className="block rounded-lg px-4 py-3 text-sm font-medium text-slate-700">{item.label}</Link>)}
          <Button href="/contato" className="mt-2 w-full">Solicitar Orçamento</Button>
        </div>
      )}
    </header>
  );
}
