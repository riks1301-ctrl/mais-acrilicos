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

export function isPlausibleMetaToken(token: string | null, graphHost: MetaGraphHost = "instagram"): boolean {
  if (!token || token.length < 40) return false;
  if (/[•*]/.test(token) || /configurado/i.test(token)) return false;
  if (token.startsWith("sk_")) return false;
  if (graphHost === "instagram" && !token.startsWith("IG")) return false;
  return /^[\w%+=/.-]+$/.test(token);
}

export function describeTokenProblem(token: string | null, graphHost: MetaGraphHost = "instagram"): string | null {
  if (!token) return "Access token ausente. Configure META_ACCESS_TOKEN na Vercel (token que começa com IG).";
  if (token.startsWith("sk_")) {
    return "Token errado: parece chave Stripe (sk_...). Apague META_ACCESS_TOKEN na Vercel e cole o token IG do Meta Developers.";
  }
  if (graphHost === "instagram" && !token.startsWith("IG")) {
    return "Token do Instagram deve começar com IG. Meta Developers → Passo 2 → Gerar token → cole na Vercel.";
  }
  if (!isPlausibleMetaToken(token, graphHost)) {
    return "Token inválido ou corrompido. Gere um novo no Meta Developers e atualize na Vercel.";
  }
  return null;
}

export function pickAccessToken(
  envToken: string | null,
  dbToken: string | null,
  graphHost: MetaGraphHost = resolveGraphHost()
): { accessToken: string | null; tokenSource: "vercel" | "painel" | "nenhum" } {
  const envOk = envToken && isPlausibleMetaToken(envToken, graphHost);
  const dbOk = dbToken && isPlausibleMetaToken(dbToken, graphHost);
  if (envOk) return { accessToken: envToken, tokenSource: "vercel" };
  if (dbOk) return { accessToken: dbToken, tokenSource: "painel" };
  if (envToken) return { accessToken: envToken, tokenSource: "vercel" };
  if (dbToken) return { accessToken: dbToken, tokenSource: "painel" };
  return { accessToken: null, tokenSource: "nenhum" };
}

export function resolveGraphHost(): MetaGraphHost {
  const env = process.env.META_GRAPH_HOST?.toLowerCase();
  if (env === "facebook" || env === "instagram") return env;
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

  const tokenProblem = describeTokenProblem(config.accessToken, config.graphHost);
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
