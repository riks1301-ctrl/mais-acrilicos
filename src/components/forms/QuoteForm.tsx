"use client";

import { Button } from "@/components/ui/Button";
import { CheckCircle, Loader2 } from "lucide-react";
import { useState } from "react";

export function QuoteForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/quotes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(form)) });
      if (!res.ok) throw new Error((await res.json()).error || "Erro");
      setSuccess(true);
      e.currentTarget.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  if (success) return (
    <div className="rounded-2xl bg-green-50 p-12 text-center">
      <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
      <h3 className="mt-4 text-2xl font-bold">Orçamento enviado!</h3>
      <p className="mt-2 text-slate-600">Entraremos em contato em até 24h úteis.</p>
      <Button variant="outline" className="mt-6" onClick={() => setSuccess(false)}>Enviar outro</Button>
    </div>
  );

  const input = "w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20";
  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div><label className="mb-1 block text-sm font-medium">Nome *</label><input name="name" required className={input} /></div>
        <div><label className="mb-1 block text-sm font-medium">E-mail *</label><input name="email" type="email" required className={input} /></div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div><label className="mb-1 block text-sm font-medium">Telefone *</label><input name="phone" required className={input} /></div>
        <div><label className="mb-1 block text-sm font-medium">Empresa</label><input name="company" className={input} /></div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div><label className="mb-1 block text-sm font-medium">Segmento</label><select name="segment" className={input}><option value="">Selecione</option><option>Supermercado</option><option>Farmácia</option><option>Varejo</option></select></div>
        <div><label className="mb-1 block text-sm font-medium">Produto</label><select name="product" className={input}><option value="">Selecione</option><option>Displays de Acrílico</option><option>Luminosos</option><option>Letras Caixa</option><option>Fachadas</option></select></div>
      </div>
      <div><label className="mb-1 block text-sm font-medium">Projeto *</label><textarea name="message" required rows={4} className={input} placeholder="Descreva seu projeto..." /></div>
      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={loading}>{loading ? <><Loader2 className="animate-spin" /> Enviando...</> : "Solicitar Orçamento Gratuito"}</Button>
    </form>
  );
}
