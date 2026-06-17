"use client";

import { ImageLibrary } from "@/components/admin/instagram/ImageLibrary";

export function ImagesPageClient() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Biblioteca de imagens</h2>
        <p className="mt-1 text-slate-600">
          Envie fotos pelo botão <strong>+ Upload</strong> e use nos posts. Formatos: JPEG, PNG ou WebP (até 10 MB).
        </p>
      </div>
      <ImageLibrary />
    </div>
  );
}
