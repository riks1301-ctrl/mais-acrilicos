/** Converte links de compartilhamento do Google Drive em URL direta (sem upload no servidor). */
export function parseGoogleDriveFileId(url: string): string | null {
  const trimmed = url.trim();
  const patterns = [
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/uc\?(?:export=(?:view|download)&)?id=([a-zA-Z0-9_-]+)/,
    /docs\.google\.com\/uc\?id=([a-zA-Z0-9_-]+)/,
  ];
  for (const re of patterns) {
    const m = trimmed.match(re);
    if (m?.[1]) return m[1];
  }
  return null;
}

export function googleDriveDirectUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}

export function normalizeExternalImageUrl(raw: string): { url: string; driveFileId: string | null } | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const driveId = parseGoogleDriveFileId(trimmed);
  if (driveId) {
    return { url: googleDriveDirectUrl(driveId), driveFileId: driveId };
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return { url: trimmed, driveFileId: null };
  }

  return null;
}

export function parseExternalUrlLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}
