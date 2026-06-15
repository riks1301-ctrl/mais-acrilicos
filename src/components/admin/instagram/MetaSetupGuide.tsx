"use client";

const STEPS = [
  {
    title: "1. Gerar token no Meta (5 min)",
    body: (
      <ol className="list-decimal space-y-2 pl-5">
        <li>
          Abra{" "}
          <a href="https://developers.facebook.com/apps/3200368863497226/" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline">
            developers.facebook.com → app maisacrilico-IG
          </a>
        </li>
        <li>Menu esquerdo → <strong>Casos de uso</strong> → lápis em <strong>Gerenciar mensagens e conteúdo no Instagram</strong></li>
        <li>Menu esquerdo → <strong>Configuração da API com login do Instagram</strong></li>
        <li><strong>Passo 2</strong> → na linha <strong>maisacrilico</strong> → clique <strong>Gerar token</strong></li>
        <li>Copie o token <strong>inteiro</strong> (começa com <code className="rounded bg-slate-100 px-1">IG</code>, texto longo)</li>
      </ol>
    ),
  },
  {
    title: "2. Colar no painel (mais fácil)",
    body: (
      <ol className="list-decimal space-y-2 pl-5">
        <li>Neste painel, campo <strong>Access Token</strong> → cole o token <code className="rounded bg-slate-100 px-1">IG...</code></li>
        <li>Clique <strong>Salvar configuração</strong></li>
        <li>Modo: <strong>TESTE (não publica)</strong></li>
        <li>Clique <strong>Testar conexão Meta</strong></li>
      </ol>
    ),
  },
  {
    title: "3. Vercel (opcional, para produção)",
    body: (
      <ol className="list-decimal space-y-2 pl-5">
        <li>
          <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline">
            vercel.com
          </a>{" "}
          → projeto <strong>mais-acrilicos</strong> → <strong>Settings</strong> → <strong>Environment Variables</strong>
        </li>
        <li>
          <strong>Apague</strong> <code className="rounded bg-slate-100 px-1">META_ACCESS_TOKEN</code> se começar com{" "}
          <code className="rounded bg-red-100 px-1">sk_live_</code> (isso é Stripe, não Meta)
        </li>
        <li>Crie de novo com o token <code className="rounded bg-slate-100 px-1">IG...</code></li>
        <li>Confira também: <code className="rounded bg-slate-100 px-1">META_APP_ID</code>=3200368863497226,{" "}
          <code className="rounded bg-slate-100 px-1">META_IG_BUSINESS_ACCOUNT_ID</code>=27079826968347998,{" "}
          <code className="rounded bg-slate-100 px-1">META_GRAPH_HOST</code>=instagram</li>
        <li><strong>Save</strong> → <strong>Redeploy</strong></li>
      </ol>
    ),
  },
];

export function MetaSetupGuide() {
  return (
    <details className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-950 open:pb-5">
      <summary className="cursor-pointer font-bold">Guia passo a passo — configurar token Instagram</summary>
      <div className="mt-4 space-y-6">
        <p className="text-amber-900">
          O erro <strong>Cannot parse access token</strong> quase sempre é token errado na Vercel (ex.: chave Stripe{" "}
          <code className="rounded bg-white px-1">sk_live_</code>). O token certo começa com <strong>IG</strong>.
        </p>
        {STEPS.map((s) => (
          <div key={s.title}>
            <h3 className="mb-2 font-semibold">{s.title}</h3>
            {s.body}
          </div>
        ))}
      </div>
    </details>
  );
}
