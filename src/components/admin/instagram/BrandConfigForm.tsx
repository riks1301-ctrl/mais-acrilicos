"use client";

import { ListField } from "@/components/admin/instagram/ListField";
import { ART_TEMPLATE_LABELS } from "@/lib/instagram/art/brand-library";
import type { BrandConfigInput } from "@/lib/instagram/schemas";
import { useEffect, useState } from "react";

type BrandData = BrandConfigInput & { id?: string };

const emptyForm: BrandData = {
  companyName: "",
  instagramHandle: "",
  segment: "",
  tone: "",
  mainCta: "",
  whatsappNumber: "",
  targetAudience: [""],
  differentials: [""],
  primaryHashtags: [""],
  localHashtags: [""],
  logoUrl: "",
  brandColors: { primary: "#0369a1", secondary: "#0ea5e9", accent: "#f59e0b" },
  brandFonts: { heading: "Arial, Helvetica, sans-serif", body: "Arial, Helvetica, sans-serif" },
  artTemplateSet: "carousel",
  visualGuidelines: "",
  publicationMode: "MANUAL",
};

export function BrandConfigForm() {
  const [form, setForm] = useState<BrandData>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/instagram/brand")
      .then((r) => r.json())
      .then((data) => {
        if (data?.id) {
          setForm({
            companyName: data.companyName,
            instagramHandle: data.instagramHandle,
            segment: data.segment,
            tone: data.tone,
            mainCta: data.mainCta,
            whatsappNumber: data.whatsappNumber,
            targetAudience: data.targetAudience?.length ? data.targetAudience : [""],
            differentials: data.differentials?.length ? data.differentials : [""],
            primaryHashtags: data.primaryHashtags?.length ? data.primaryHashtags : [""],
            localHashtags: data.localHashtags?.length ? data.localHashtags : [""],
            logoUrl: data.logoUrl || "",
            brandColors: data.brandColors || emptyForm.brandColors,
            brandFonts: data.brandFonts || emptyForm.brandFonts,
            artTemplateSet: data.artTemplateSet || "carousel",
            visualGuidelines: data.visualGuidelines || "",
            publicationMode: data.publicationMode || "MANUAL",
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  function setField<K extends keyof BrandData>(key: K, value: BrandData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const payload = {
      ...form,
      targetAudience: form.targetAudience.filter(Boolean),
      differentials: form.differentials.filter(Boolean),
      primaryHashtags: form.primaryHashtags.filter(Boolean),
      localHashtags: form.localHashtags.filter(Boolean),
    };

    const res = await fetch("/api/admin/instagram/brand", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setMessage(data.error || "Erro ao salvar");
      return;
    }
    setMessage("Configuração da marca salva com sucesso.");
  }

  if (loading) return <p className="text-slate-500">Carregando configuração...</p>;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="rounded-2xl bg-white p-6 shadow-card space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Identidade da marca</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nome da empresa" value={form.companyName} onChange={(v) => setField("companyName", v)} />
          <Field label="Instagram (@)" value={form.instagramHandle} onChange={(v) => setField("instagramHandle", v)} placeholder="maisacrilicos" />
          <Field label="Segmento" value={form.segment} onChange={(v) => setField("segment", v)} />
          <Field label="WhatsApp (com DDI)" value={form.whatsappNumber} onChange={(v) => setField("whatsappNumber", v)} placeholder="5511999999999" />
        </div>
        <Field label="Tom de voz" value={form.tone} onChange={(v) => setField("tone", v)} />
        <Field label="CTA principal" value={form.mainCta} onChange={(v) => setField("mainCta", v)} />
        <Field label="URL do logo (opcional)" value={form.logoUrl || ""} onChange={(v) => setField("logoUrl", v)} />
        <textarea
          value={form.visualGuidelines || ""}
          onChange={(e) => setField("visualGuidelines", e.target.value)}
          rows={4}
          placeholder="Diretrizes visuais para o agente..."
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-card space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Público e posicionamento</h2>
        <ListField label="Público-alvo" values={form.targetAudience} onChange={(v) => setField("targetAudience", v)} placeholder="Ex: Farmácias" />
        <ListField label="Diferenciais" values={form.differentials} onChange={(v) => setField("differentials", v)} placeholder="Ex: Produção sob medida" />
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-card space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Hashtags</h2>
        <ListField label="Hashtags do nicho" values={form.primaryHashtags} onChange={(v) => setField("primaryHashtags", v)} placeholder="#comunicacaovisual" />
        <ListField label="Hashtags locais" values={form.localHashtags} onChange={(v) => setField("localHashtags", v)} placeholder="#saopaulo" />
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-card space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Biblioteca visual da marca</h2>
        <p className="text-sm text-slate-600">Logo, cores, fontes e template padrão para o gerador automático de artes.</p>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Template padrão de arte</label>
          <select
            value={form.artTemplateSet || "carousel"}
            onChange={(e) => setField("artTemplateSet", e.target.value as BrandData["artTemplateSet"])}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
          >
            {(Object.entries(ART_TEMPLATE_LABELS) as [string, string][]).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Fonte títulos" value={form.brandFonts?.heading || ""} onChange={(v) => setField("brandFonts", { ...form.brandFonts!, heading: v })} />
          <Field label="Fonte corpo" value={form.brandFonts?.body || ""} onChange={(v) => setField("brandFonts", { ...form.brandFonts!, body: v })} />
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-card space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Cores da marca</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <ColorField label="Primária" value={form.brandColors?.primary || "#0369a1"} onChange={(v) => setField("brandColors", { ...form.brandColors!, primary: v })} />
          <ColorField label="Secundária" value={form.brandColors?.secondary || "#0ea5e9"} onChange={(v) => setField("brandColors", { ...form.brandColors!, secondary: v })} />
          <ColorField label="Destaque" value={form.brandColors?.accent || "#f59e0b"} onChange={(v) => setField("brandColors", { ...form.brandColors!, accent: v })} />
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-card space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Modo de publicação</h2>
        <p className="text-sm text-slate-600">
          No início, use <strong>Modo seguro (manual)</strong>: o agente cria conteúdo, mas nada é publicado sem sua aprovação.
        </p>
        <div className="flex flex-wrap gap-3">
          {(["MANUAL", "AUTO"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setField("publicationMode", mode)}
              className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                form.publicationMode === mode
                  ? "border-brand-600 bg-brand-50 text-brand-700"
                  : "border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              {mode === "MANUAL" ? "Modo 1 — Seguro (manual)" : "Modo 2 — Automático autorizado"}
            </button>
          ))}
        </div>
        {form.publicationMode === "AUTO" && (
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
            O modo automático só funcionará após configurar Meta Graph API, token e permissões (Etapa 5). Até lá, todo conteúdo passará por aprovação.
          </p>
        )}
      </section>

      {message && (
        <p className={`rounded-xl px-4 py-3 text-sm ${message.includes("sucesso") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {message}
        </p>
      )}

      <button type="submit" disabled={saving} className="rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
        {saving ? "Salvando..." : "Salvar configuração da marca"}
      </button>
    </form>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
      />
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <div className="flex items-center gap-3">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-10 w-14 cursor-pointer rounded-lg border border-slate-200" />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm" />
      </div>
    </div>
  );
}
