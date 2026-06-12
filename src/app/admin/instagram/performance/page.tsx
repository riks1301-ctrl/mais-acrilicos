import { PerformanceDashboard } from "@/components/admin/instagram/PerformanceDashboard";

export default function InstagramPerformancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Performance e aprendizado</h2>
        <p className="mt-1 text-slate-600">
          Métricas reais da Meta, rankings e recomendações para melhorar os próximos posts. Nada é publicado nesta etapa.
        </p>
      </div>
      <PerformanceDashboard />
    </div>
  );
}
