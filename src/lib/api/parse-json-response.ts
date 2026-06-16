export async function parseApiJson<T = Record<string, unknown>>(res: Response): Promise<T> {
  const text = await res.text();
  const contentType = res.headers.get("content-type") ?? "";

  if (!text) {
    if (!res.ok) throw new Error(`Erro ${res.status} do servidor (resposta vazia).`);
    return {} as T;
  }

  if (!contentType.includes("application/json") && text.trimStart().startsWith("<")) {
    if (res.status === 504 || res.status === 502) {
      throw new Error(`Servidor demorou demais (${res.status}). Tente novamente em instantes.`);
    }
    if (res.status === 401 || res.status === 403) {
      throw new Error("Sessão expirada. Faça login novamente no admin.");
    }
    throw new Error(
      `Resposta inválida do servidor (${res.status}). O deploy pode estar desatualizado ou a API caiu.`
    );
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Resposta inválida do servidor: ${text.slice(0, 120)}`);
  }
}
