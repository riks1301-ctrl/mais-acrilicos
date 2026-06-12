"use client";

import { useEffect, useState } from "react";

type Persona = {
  id: string;
  name: string;
  description: string;
  painPoints: string[];
  goals: string[];
  segments: string[];
};

export function PersonasPanel() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/instagram/brand")
      .then((r) => r.json())
      .then((data) => setPersonas(data?.personas || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (!personas.length) return null;

  return (
    <section className="rounded-2xl bg-white p-6 shadow-card">
      <h2 className="text-lg font-bold text-slate-900">Personas configuradas</h2>
      <p className="mt-1 text-sm text-slate-600">O agente usa esses perfis para direcionar ideias e legendas.</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {personas.map((p) => (
          <div key={p.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <h3 className="font-semibold text-slate-900">{p.name}</h3>
            <p className="mt-1 text-sm text-slate-600 line-clamp-2">{p.description}</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {p.segments.map((s) => (
                <span key={s} className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-600 ring-1 ring-slate-200">
                  {s}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
