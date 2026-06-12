import { PROMPT_PURPOSES } from "@/lib/instagram/images/constants";
import type { ArtDimensions } from "./types";

const FALLBACK: ArtDimensions = { width: 1080, height: 1080, format: "1080x1080" };

export function parseFormat(format?: string | null): ArtDimensions {
  if (!format) return FALLBACK;
  const known = PROMPT_PURPOSES.find((p) => p.format === format);
  if (known) {
    const [w, h] = known.format.split("x").map(Number);
    return { width: w, height: h, format: known.format };
  }
  const m = format.match(/^(\d+)x(\d+)$/);
  if (m) return { width: Number(m[1]), height: Number(m[2]), format };
  return FALLBACK;
}
