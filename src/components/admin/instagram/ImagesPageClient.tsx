"use client";

import { DriveImportForm } from "@/components/admin/instagram/DriveImportForm";
import { ImageLibrary } from "@/components/admin/instagram/ImageLibrary";
import { useState } from "react";

export function ImagesPageClient() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Biblioteca de imagens</h2>
        <p className="mt-1 text-slate-600">Fotos reais da empresa, obras, bastidores e materiais para usar nos posts.</p>
      </div>
      <DriveImportForm onImported={() => setRefreshKey((k) => k + 1)} />
      <ImageLibrary key={refreshKey} />
    </div>
  );
}
