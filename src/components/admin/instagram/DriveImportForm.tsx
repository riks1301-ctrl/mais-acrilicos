"use client";

import { IMAGE_CATEGORIES } from "@/lib/instagram/images/constants";
import type { IgImageCategory } from "@prisma/client";
import { useState } from "react";

type Props = {
  onImported?: () => void;
};

export function DriveImportForm({ onImported }: Props) {
  const [urls, setUrls] = useState("");
  const [category, setCategory] = useState<IgImageCategory | "">("OBRA_PRONTA");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function importUrls() {
    const lines = urls
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (!lines.length) {
      setMessage("Cole pelo menos um link do Google Drive.");
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/instagram/images/external", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          urls: lines,
          category: category || undefined,
          status: "AVAILABLE",
          imageType: "REAL",
          tags: ["google_drive"],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Erro ao importar");
        return;
      }
      setMessage(data.message);
      if (data.created?.length) {
        setUrls("");
        onImported?.();
      }
    } catch {
      setMessage("Falha de rede ao importar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 space-y-4">
      <div>
        <h3 className="font-bold text-emerald-900">Importar do Google Drive (sem upload)</h3>
        <p className="mt-1 text-sm text-emerald-800">
          Cole links de arquivos do Drive — uma linha por foto. O servidor só guarda o link; as fotos continuam no seu Drive.
        </p>
        <p className="mt-2 text-xs text-emerald-700">
          No Drive: clique com o botão direito no arquivo → <strong>Compartilhar</strong> →{" "}
          <strong>Qualquer pessoa com o link</strong> (visualizador). Para publicar no Instagram, o link precisa ser público.
        </p>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-emerald-900">Categoria</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as IgImageCategory)}
          className="w-full max-w-xs rounded-xl border px-3 py-2 text-sm"
        >
          {IMAGE_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <textarea
        value={urls}
        onChange={(e) => setUrls(e.target.value)}
        rows={5}
        placeholder={`https://drive.google.com/file/d/SEU_ID/view\nhttps://drive.google.com/file/d/OUTRO_ID/view`}
        className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-mono"
      />

      <button
        type="button"
        onClick={importUrls}
        disabled={loading}
        className="rounded-xl bg-emerald-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
      >
        {loading ? "Importando..." : "Importar links do Drive"}
      </button>

      {message && (
        <p className={`text-sm ${message.includes("importada") ? "text-emerald-800" : "text-red-600"}`}>{message}</p>
      )}
    </section>
  );
}
