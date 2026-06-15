import { MetaConfigForm } from "@/components/admin/instagram/MetaConfigForm";

export default function InstagramMetaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Integração Meta Graph API</h2>
        <p className="mt-1 text-slate-600">Configure Instagram Business, token e modos de publicação segura.</p>
        <p className="mt-1 text-xs text-slate-400">Painel v2026.01.21-meta — se não vir o guia amarelo abaixo, o deploy está desatualizado.</p>
      </div>
      <MetaConfigForm />
    </div>
  );
}
