import { parseMetaError } from "./errors";
import type { MetaConfig } from "./types";

export function graphBaseUrl(config: MetaConfig): string {
  return `https://graph.facebook.com/${config.apiVersion}`;
}

export async function graphFetch<T>(
  config: MetaConfig,
  path: string,
  options: { method?: string; params?: Record<string, string>; body?: Record<string, string> } = {}
): Promise<T> {
  if (!config.accessToken) throw new Error("Access token Meta não configurado");

  const url = new URL(`${graphBaseUrl(config)}${path}`);
  url.searchParams.set("access_token", config.accessToken);
  if (options.params) {
    for (const [k, v] of Object.entries(options.params)) url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), {
    method: options.method ?? (options.body ? "POST" : "GET"),
    headers: options.body ? { "Content-Type": "application/x-www-form-urlencoded" } : undefined,
    body: options.body ? new URLSearchParams(options.body).toString() : undefined,
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    const err = parseMetaError(data);
    const e = new Error(err.message) as Error & { meta?: typeof err; status?: number };
    e.meta = err;
    e.status = res.status;
    throw e;
  }

  return data as T;
}
