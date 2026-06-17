import type { MetaGraphError } from "./types";

export function parseMetaError(body: unknown): MetaGraphError {
  if (body && typeof body === "object" && "error" in body) {
    const err = (body as { error: MetaGraphError }).error;
    return {
      message: err.message || "Erro desconhecido da Meta",
      type: err.type,
      code: err.code,
      error_subcode: err.error_subcode,
      fbtrace_id: err.fbtrace_id,
    };
  }
  return { message: "Erro desconhecido da Meta Graph API" };
}

export function sanitizeMetaError(err: MetaGraphError): string {
  const parts = [err.message];
  if (err.code) parts.push(`code=${err.code}`);
  if (err.fbtrace_id) parts.push(`trace=${err.fbtrace_id}`);
  if (err.code === 9004) {
    parts.push(
      "Dica: reenvie a foto (JPEG/PNG), aguarde o deploy e tente Publicar de novo — a imagem precisa ser HTTPS pública."
    );
  }
  return parts.join(" | ");
}

export function handleMetaError(body: unknown): never {
  const err = parseMetaError(body);
  const e = new Error(sanitizeMetaError(err)) as Error & { meta?: MetaGraphError };
  e.meta = err;
  throw e;
}
