import { parseMetaError } from "./errors";
import type { MetaConfig, MetaGraphHost } from "./types";

export function sanitizeAccessToken(token: string | null | undefined): string | null {
  if (!token) return null;
  let t = token.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    t = t.slice(1, -1).trim();
  }
  return t || null;
}

export function isPlausibleMetaToken(token: string | null): boolean {
  if (!token || token.length < 40) return false;
  if (/[•*]/.test(token) || /configurado/i.test(token)) return false;
  return /^[\w%+=/.-]+$/.test(token);
}

export function describeTokenProblem(token: string | null): string | null {
  if (!token) return "Access token ausente. Configure META_ACCESS_TOKEN na Vercel ou cole no painel.";
  if (!isPlausibleMetaToken(token)) {
    return "Token inválido ou corrompido (muito curto ou caracteres estranhos). Gere um novo no Meta Developers e atualize na Vercel.";
  }
  return null;
}

export function resolveGraphHost(): MetaGraphHost {
  const env = process.env.META_GRAPH_HOST?.toLowerCase();
  if (env === "facebook" || env === "instagram") return env;
  // App maisacrilico-IG usa Instagram Login → graph.instagram.com
  return "instagram";
}

export function graphBaseUrl(config: MetaConfig): string {
  const host = config.graphHost === "facebook" ? "graph.facebook.com" : "graph.instagram.com";
  return `https://${host}/${config.apiVersion}`;
}

export async function graphFetch<T>(
  config: MetaConfig,
  path: string,
  options: { method?: string; params?: Record<string, string>; body?: Record<string, string> } = {}
): Promise<T> {
  if (!config.accessToken) throw new Error("Access token Meta não configurado");

  const tokenProblem = describeTokenProblem(config.accessToken);
  if (tokenProblem) throw new Error(tokenProblem);

  const url = new URL(`${graphBaseUrl(config)}${path}`);
  if (options.params) {
    for (const [k, v] of Object.entries(options.params)) url.searchParams.set(k, v);
  }

  const useBearer = config.graphHost === "instagram";
  const headers: Record<string, string> = {};
  if (options.body) headers["Content-Type"] = "application/x-www-form-urlencoded";
  if (useBearer) {
    headers.Authorization = `Bearer ${config.accessToken}`;
  } else {
    url.searchParams.set("access_token", config.accessToken);
  }

  const body = options.body
    ? new URLSearchParams({ ...options.body, ...(useBearer ? {} : { access_token: config.accessToken }) }).toString()
    : undefined;

  const res = await fetch(url.toString(), {
    method: options.method ?? (options.body ? "POST" : "GET"),
    headers: Object.keys(headers).length ? headers : undefined,
    body,
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
