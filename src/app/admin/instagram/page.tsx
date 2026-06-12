import { AgentOnboardingPanel } from "@/components/admin/instagram/AgentOnboardingPanel";
import { EXAMPLE_POST_IDEAS } from "@/lib/instagram/brand-defaults";
import { IG_STATUS_LABELS, WEEKLY_THEMES } from "@/lib/instagram/constants";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import type { IgPostStatus } from "@prisma/client";

export default async function InstagramDashboardPage() {
  const statuses = Object.keys(IG_STATUS_LABELS) as IgPostStatus[];
  let brand: Awaited<ReturnType<typeof prisma.instagramBrandConfig.findFirst>> & { personas?: { id: string }[] } | null = null;
  let statusCounts = statuses.map((status) => ({ status, count: 0 }));
  let servicesCount = 0;

  try {
    brand = await prisma.instagramBrandConfig.findFirst({
      include: { personas: true },
      orderBy: { createdAt: "asc" },
    });
    statusCounts = brand
      ? await Promise.all(
          statuses.map(async (status) => ({
            status,
            count: await prisma.instagramPost.count({ where: { brandConfigId: brand!.id, status } }),
          }))
        )
      : statuses.map((status) => ({ status, count: 0 }));
    servicesCount = await prisma.instagramService.count();
  } catch {
    /* banco indisponível */
  }

  const pendingApproval = statusCounts.find((s) => s.status === "PENDING_APPROVAL")?.count ?? 0;
  const published = statusCounts.find((s) => s.status === "PUBLISHED")?.count ?? 0;

  return (
    <div className="space-y-8">
      <AgentOnboardingPanel />

      <div className="grid gap-4 lg:grid-cols-3">
        <StatusCard
          title="Modo de operação"
          value={brand?.publicationMode === "AUTO" ? "Automático autorizado" : "Seguro (manual)"}
          subtitle="Nada publica sem aprovação no modo seguro"
          tone={brand?.publicationMode === "AUTO" ? "amber" : "green"}
        />
        <StatusCard
          title="Meta Graph API"
          value={brand?.metaConnected ? "Conectado" : "Não conectado"}
          subtitle={brand?.metaConnected ? `Modo ${brand.metaMode}` : "Configure em Meta API →"}
          tone={brand?.metaConnected ? "green" : "slate"}
        />
        <StatusCard
          title="Marca configurada"
          value={brand ? "Sim" : "Não"}
          subtitle={brand ? `@${brand.instagramHandle}` : "Configure em Marca →"}
          tone={brand ? "green" : "amber"}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Aguardando aprovação" value={pendingApproval} />
        <MetricCard label="Publicados" value={published} />
        <MetricCard label="Personas" value={brand?.personas?.length ?? 0} />
        <MetricCard label="Serviços cadastrados" value={servicesCount} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/admin/instagram/aprovacao" className="rounded-2xl bg-amber-500 p-5 font-semibold text-white shadow-card hover:bg-amber-600">
          Fila de aprovação →
        </Link>
        <Link href="/admin/instagram/posts" className="rounded-2xl bg-brand-600 p-5 font-semibold text-white shadow-card hover:bg-brand-700">
          Gerar ideias e legendas →
        </Link>
        <Link href="/admin/instagram/calendario" className="rounded-2xl bg-white p-5 font-semibold text-brand-700 shadow-card ring-1 ring-brand-100 hover:bg-brand-50">
          Calendário editorial →
        </Link>
        <Link href="/admin/instagram/imagens" className="rounded-2xl bg-white p-5 font-semibold text-slate-700 shadow-card ring-1 ring-slate-100 hover:bg-slate-50 sm:col-span-2">
          Biblioteca de imagens →
        </Link>
      </div>

      <section className="rounded-2xl bg-white p-6 shadow-card">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold">Pipeline de conteúdo</h2>
          <Link href="/admin/instagram/marca" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
            Configurar marca →
          </Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {statusCounts.map(({ status, count }) => (
            <div key={status} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">{IG_STATUS_LABELS[status]}</p>
              <p className="text-2xl font-bold text-slate-900">{count}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-card">
        <h2 className="text-lg font-bold">Calendário editorial sugerido</h2>
        <p className="mt-1 text-sm text-slate-600">Modelo semanal que o agente seguirá a partir da Etapa 2.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {WEEKLY_THEMES.map((day) => (
            <div key={day.day} className="rounded-xl border border-slate-100 p-4">
              <p className="text-sm font-semibold text-brand-700">{day.label}</p>
              <p className="mt-1 text-sm text-slate-800">{day.theme}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-card">
        <h2 className="text-lg font-bold">Exemplos de posts que o agente gerará</h2>
        <ul className="mt-4 space-y-2">
          {EXAMPLE_POST_IDEAS.map((idea) => (
            <li key={idea} className="flex items-start gap-2 text-sm text-slate-700">
              <span className="mt-0.5 text-brand-600">•</span>
              {idea}
            </li>
          ))}
        </ul>
      </section>

      {!brand && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h3 className="font-bold text-amber-900">Primeiro passo</h3>
          <p className="mt-2 text-sm text-amber-800">
            Configure a identidade da Mais Acrílicos para o agente seguir tom, CTA e público corretos.
          </p>
          <Link href="/admin/instagram/marca" className="mt-4 inline-block rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700">
            Configurar marca agora
          </Link>
        </div>
      )}
    </div>
  );
}

function StatusCard({
  title,
  value,
  subtitle,
  tone,
}: {
  title: string;
  value: string;
  subtitle: string;
  tone: "green" | "amber" | "slate";
}) {
  const tones = {
    green: "border-green-200 bg-green-50",
    amber: "border-amber-200 bg-amber-50",
    slate: "border-slate-200 bg-slate-50",
  };

  return (
    <div className={`rounded-2xl border p-5 ${tones[tone]}`}>
      <p className="text-sm text-slate-600">{title}</p>
      <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
      <p className="mt-2 text-xs text-slate-600">{subtitle}</p>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-card">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
