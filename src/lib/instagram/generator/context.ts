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

export function normalizeWhatsappDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

/** Ex.: 5541987675762 → (41) 98767-5762 */
export function formatBrazilWhatsappDisplay(phone: string): string {
  let d = normalizeWhatsappDigits(phone);
  if (d.startsWith("55") && d.length >= 12) d = d.slice(2);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return phone.trim() || d;
}

export function buildWhatsappCta(brand: BrandContext): string {
  const digits = normalizeWhatsappDigits(brand.whatsappNumber);
  const display = formatBrazilWhatsappDisplay(brand.whatsappNumber);
  return `📲 ${brand.mainCta}\n👉 wa.me/${digits}\n📱 ${display}`;
}

export function whatsappLink(brand: BrandContext, message?: string): string {
  const text = message ? `&text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${normalizeWhatsappDigits(brand.whatsappNumber)}${text ? `?${text.slice(1)}` : ""}`;
}
