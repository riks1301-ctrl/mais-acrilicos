import Image from "next/image";
import Link from "next/link";

export function ImageCard({ title, description, image, href, tag }: { title: string; description: string; image: string; href: string; tag?: string }) {
  return (
    <Link href={href} className="group overflow-hidden rounded-2xl bg-white shadow-card transition-all hover:-translate-y-1 hover:shadow-premium">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image src={image} alt={title} fill className="object-cover transition-transform group-hover:scale-105" sizes="(max-width:768px) 100vw, 33vw" />
        {tag && <span className="absolute left-4 top-4 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white">{tag}</span>}
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold text-slate-900 group-hover:text-brand-600">{title}</h3>
        <p className="mt-2 text-slate-600 line-clamp-2">{description}</p>
        <span className="mt-4 inline-block text-sm font-semibold text-brand-600">Saiba mais →</span>
      </div>
    </Link>
  );
}
