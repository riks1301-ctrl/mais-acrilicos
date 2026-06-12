import { BrandConfigForm } from "@/components/admin/instagram/BrandConfigForm";
import { PersonasPanel } from "@/components/admin/instagram/PersonasPanel";

export default function InstagramBrandPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Cadastro da marca</h2>
        <p className="mt-1 text-slate-600">
          Defina tom, CTA, público e diretrizes visuais. O agente usa essas informações em todas as etapas.
        </p>
      </div>
      <BrandConfigForm />
      <PersonasPanel />
    </div>
  );
}
