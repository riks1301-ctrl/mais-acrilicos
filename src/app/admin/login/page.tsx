"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: form.get("email"), password: form.get("password") }) });
    if (!res.ok) { setError((await res.json()).error || "Erro"); setLoading(false); return; }
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl bg-white p-8 shadow-premium space-y-4">
        <h1 className="text-center text-2xl font-bold">Painel Admin</h1>
        <input name="email" type="email" required placeholder="E-mail" className="w-full rounded-xl border px-4 py-3" />
        <input name="password" type="password" required placeholder="Senha" className="w-full rounded-xl border px-4 py-3" />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="w-full rounded-xl bg-brand-600 py-3 font-semibold text-white">{loading ? "Entrando..." : "Entrar"}</button>
      </form>
    </div>
  );
}
