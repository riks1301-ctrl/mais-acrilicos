import type { InstagramBrandConfig, InstagramMetric } from "@prisma/client";

const BRAND_SECRET_FIELDS = [
  "metaAccessTokenEnc",
  "metaPageId",
  "metaIgUserId",
  "metaAppId",
] as const;

/** Remove campos sensíveis da marca antes de enviar ao cliente. */
export function sanitizeBrandForClient<T extends Partial<InstagramBrandConfig> | null>(brand: T): T {
  if (!brand) return brand;
  const copy = { ...brand } as Record<string, unknown>;
  for (const key of BRAND_SECRET_FIELDS) {
    if (key in copy) delete copy[key];
  }
  return copy as T;
}

/** Remove payload bruto da Meta (pode conter detalhes de token/erro). */
export function sanitizeMetricForClient<M extends Partial<InstagramMetric>>(metric: M): Omit<M, "rawInsights"> {
  const rest = { ...metric };
  delete (rest as { rawInsights?: unknown }).rawInsights;
  return rest as Omit<M, "rawInsights">;
}
