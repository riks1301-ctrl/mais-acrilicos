/** URL relativa para servir arquivo do Drive local (requer sessão admin). */
export function adminLocalMediaUrl(localPath: string): string {
  return `/api/admin/instagram/media/local?path=${encodeURIComponent(localPath)}`;
}

/** Garante URL same-origin para previews no painel admin. */
export function resolveAdminImageSrc(image: { url: string; localPath?: string | null }): string {
  if (image.localPath) return adminLocalMediaUrl(image.localPath);

  if (image.url.startsWith("/api/admin/instagram/media/")) return image.url;

  try {
    const parsed = new URL(image.url);
    if (parsed.pathname.startsWith("/api/admin/instagram/media/")) {
      return `${parsed.pathname}${parsed.search}`;
    }
  } catch {
    /* url relativa ou inválida */
  }

  return image.url;
}
