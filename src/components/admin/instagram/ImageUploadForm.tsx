"use client";

import { IMAGE_CATEGORIES, IMAGE_TYPE_LABELS } from "@/lib/instagram/images/constants";
import type { IgImageStatus, IgImageType } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Service = { id: string; name: string };

const inputCls = "w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20";

export function ImageUploadForm() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [clientProject, setClientProject] = useState("");
  const [usagePermission, setUsagePermission] = useState("uso_interno");
  const [status, setStatus] = useState<IgImageStatus>("IN_REVIEW");
  const [imageType, setImageType] = useState<IgImageType>("REAL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/instagram/services").then((r) => r.json()).then(setServices).catch(() => {});
  }, []);

  function onFileChange(f: File | null) {
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !category || description.length < 3) {
      setError("Selecione arquivo, categoria e descrição.");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", category);
    formData.append("description", description);
    formData.append("tags", tags);
    if (serviceId) formData.append("serviceId", serviceId);
    if (clientProject) formData.append("clientProject", clientProject);
    formData.append("usagePermission", usagePermission);
    formData.append("status", status);
    formData.append("imageType", imageType);

    const res = await fetch("/api/admin/instagram/images/upload", { method: "POST", body: formData });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Erro no upload");
      return;
    }

    router.push("/admin/instagram/imagens");
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-card space-y-4">
        <label className="block text-sm font-medium">Arquivo (JPEG, PNG, WebP — máx. 10MB)</label>
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => onFileChange(e.target.files?.[0] ?? null)} className="w-full text-sm" />
        {preview && (
          <div className="relative aspect-video max-w-md overflow-hidden rounded-xl border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Preview" className="h-full w-full object-contain" />
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-card grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Categoria *</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls} required>
            <option value="">Selecione</option>
            {IMAGE_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Tipo de imagem</label>
          <select value={imageType} onChange={(e) => setImageType(e.target.value as IgImageType)} className={inputCls}>
            {Object.entries(IMAGE_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Serviço relacionado</label>
          <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} className={inputCls}>
            <option value="">Nenhum</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as IgImageStatus)} className={inputCls}>
            <option value="IN_REVIEW">Em revisão</option>
            <option value="AVAILABLE">Disponível</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium">Descrição *</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputCls} required />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Tags (vírgula)</label>
          <input value={tags} onChange={(e) => setTags(e.target.value)} className={inputCls} placeholder="display, acrilico" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Cliente / projeto</label>
          <input value={clientProject} onChange={(e) => setClientProject(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Permissão de uso</label>
          <input value={usagePermission} onChange={(e) => setUsagePermission(e.target.value)} className={inputCls} />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={loading} className="rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
        {loading ? "Enviando..." : "Enviar imagem"}
      </button>
    </form>
  );
}
