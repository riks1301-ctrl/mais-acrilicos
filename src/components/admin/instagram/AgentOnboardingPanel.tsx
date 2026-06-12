"use client";

import type { AgentStatus } from "@/lib/instagram/agent-status";
import Link from "next/link";
import { useEffect, useState } from "react";

const OVERALL_CLS: Record<AgentStatus["overall"], string> = {
  setup: "border-amber-300 bg-amber-50",
  ready: "border-blue-300 bg-blue-50",
  active: "border-green-300 bg-green-50",
  attention: "border-red-300 bg-red-50",
};

const ALERT_CLS = {
  critical: "bg-red-100 text-red-900 border-red-200",
  warning: "bg-amber-100 text-amber-900 border-amber-200",
  info: "bg-blue-100 text-blue-900 border-blue-200",
};

export function AgentOnboardingPanel() {
  const [status, setStatus] = useState<AgentStatus | null>(null);

  useEffect(() => {
    fetch("/api/admin/instagram/agent-status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => {});
  }, []);

  if (!status) return null;

  const done = status.setupSteps.filter((s) => s.done).length;
  const total = status.setupSteps.length;

  return (
    <div className="space-y-4">
      <div className={`rounded-2xl border p-6 ${OVERALL_CLS[status.overall]}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-600">Status do agente</p>
            <h2 className="text-2xl font-bold text-slate-900">{status.overallLabel}</h2>
            <p className="mt-1 text-sm text-slate-600">
              Configuração: {done}/{total} · Meta {status.meta.mode} · Auto publish{" "}
              {status.meta.envAutoPublish && status.meta.autoPublish ? "LIGADO" : "desligado"}
            </p>
          </div>
          <Link
            href={status.nextStep.href}
            className="rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold text-white shadow-card hover:bg-brand-700"
          >
            Próximo passo → {status.nextStep.label}
          </Link>
        </div>
        <p className="mt-3 text-sm text-slate-700">{status.nextStep.reason}</p>
      </div>

      {status.alerts.length > 0 && (
        <div className="grid gap-2 md:grid-cols-2">
          {status.alerts.map((a, i) => (
            <div key={i} className={`rounded-xl border px-4 py-3 text-sm ${ALERT_CLS[a.severity]}`}>
              {a.message}
            </div>
          ))}
        </div>
      )}

      <section className="rounded-2xl bg-white p-6 shadow-card">
        <h3 className="font-bold text-slate-900">Checklist — primeiro post no ar</h3>
        <ol className="mt-4 space-y-3">
          {status.setupSteps.map((step, i) => (
            <li key={step.id} className="flex items-start gap-3 text-sm">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  step.done ? "bg-green-600 text-white" : "bg-slate-200 text-slate-600"
                }`}
              >
                {step.done ? "✓" : i + 1}
              </span>
              <div className="flex-1">
                <Link href={step.href} className={`font-semibold ${step.done ? "text-slate-500 line-through" : "text-brand-700 hover:underline"}`}>
                  {step.label}
                </Link>
                <p className="text-slate-500">{step.hint}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
