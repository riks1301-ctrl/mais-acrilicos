import { prisma } from "@/lib/prisma";
import type { BrandContext } from "@/lib/instagram/types";

export async function getBrandContext(): Promise<BrandContext | null> {
  return prisma.instagramBrandConfig.findFirst({
    include: {
      personas: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getBrandContextWithServices(): Promise<BrandContext | null> {
  const brand = await getBrandContext();
  if (!brand) return null;
  const services = await prisma.instagramService.findMany({ orderBy: [{ featured: "desc" }, { order: "asc" }] });
  return { ...brand, services };
}

export function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function pickSegment(brand: BrandContext): string {
  const audience = brand.targetAudience;
  if (audience.length) return pickRandom(audience).toLowerCase();
  return "lojas";
}

export function pickService(brand: BrandContext): { name: string; description: string } {
  const services = brand.services;
  if (services?.length) {
    const s = pickRandom(services);
    return { name: s.name, description: s.description };
  }
  return { name: "display de acrílico", description: "Expositores sob medida para PDV" };
}

export function pickPersona(brand: BrandContext) {
  if (!brand.personas.length) return null;
  return pickRandom(brand.personas);
}

export function buildHashtags(brand: BrandContext, extra: string[] = []): string {
  const tags = [...brand.primaryHashtags.slice(0, 8), ...brand.localHashtags.slice(0, 5), ...extra];
  const unique = Array.from(new Set(tags.map((t) => (t.startsWith("#") ? t : `#${t}`))));
  return unique.join(" ");
}

export function whatsappLink(brand: BrandContext, message?: string): string {
  const text = message ? `&text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${brand.whatsappNumber.replace(/\D/g, "")}${text ? `?${text.slice(1)}` : ""}`;
}
