const DEFAULT_TIMEOUT_MS = 20_000;

export async function fetchImageBuffer(url: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<Buffer | null> {
  if (!url.startsWith("http://") && !url.startsWith("https://")) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "image/*" },
      redirect: "follow",
    });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0) return null;
    return buf;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
