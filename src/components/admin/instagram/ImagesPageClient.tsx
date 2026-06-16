"use client";

import { DriveImportForm } from "@/components/admin/instagram/DriveImportForm";
import { ImageLibrary } from "@/components/admin/instagram/ImageLibrary";
import { useEffect, useState } from "react";

export function ImagesPageClient() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [localDriveOnly, setLocalDriveOnly] = useState(false);

  useEffect(() => {
    fetch("/api/admin/instagram/drive?limit=1")
      .then((r) => r.json())
      .then((data) => {
        const showLocal = data.env?.showLocalUi === true;
        const hasLocalImages = (data.brand?.googleDriveSyncCount ?? 0) > 0 && !showLocal;
        setLocalDriveOnly(hasLocalImages);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Biblioteca de imagens</h2>
        <p className="mt-1 text-slate-600">Fotos reais da empresa, obras, bastidores e materiais para usar nos posts.</p>
      </div>

      {localDriveOnly && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-950">
          <p className="font-semibold">Fotos do seu PC não abrem neste site (Vercel)</p>
          <p className="mt-1">
            As imagens sincronizadas de <code className="text-xs">G:\Meu Drive</code> só carregam no{" "}
            <strong>localhost</strong>. Para montar o post com fotos reais, use{" "}
            <a href="http://localhost:3000/admin/instagram" className="font-semibold text-brand-700 underline">
              http://localhost:3000
            </a>
            . Aqui na internet, use <strong>+ Upload</strong> ou publique posts já montados no PC.
          </p>
        </div>
      )}

      <DriveImportForm onImported={() => setRefreshKey((k) => k + 1)} />
      <ImageLibrary key={refreshKey} />
    </div>
  );
}
