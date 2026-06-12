import { ImageLibrary } from "@/components/admin/instagram/ImageLibrary";

export default function InstagramImagesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Biblioteca de imagens</h2>
        <p className="mt-1 text-slate-600">Fotos reais da empresa, obras, bastidores e materiais para usar nos posts.</p>
      </div>
      <ImageLibrary />
    </div>
  );
}
