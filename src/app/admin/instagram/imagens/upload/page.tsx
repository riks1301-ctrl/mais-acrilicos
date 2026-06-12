import { ImageUploadForm } from "@/components/admin/instagram/ImageUploadForm";
import Link from "next/link";

export default function InstagramImageUploadPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/instagram/imagens" className="text-sm text-slate-500 hover:text-brand-600">
          ← Voltar à biblioteca
        </Link>
        <h2 className="mt-2 text-xl font-bold text-slate-900">Upload de imagem</h2>
        <p className="mt-1 text-slate-600">Envie fotos reais de obras, bastidores e produtos da Mais Acrílicos.</p>
      </div>
      <ImageUploadForm />
    </div>
  );
}
