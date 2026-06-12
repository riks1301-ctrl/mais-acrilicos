import { timingSafeEqual } from "crypto";

export function verifyCronSecret(header: string | null, expected: string | undefined): boolean {
  if (!expected || !header) return false;
  try {
    const a = Buffer.from(header, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
