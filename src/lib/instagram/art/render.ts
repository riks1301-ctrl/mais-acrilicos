import { readFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { UPLOAD_PUBLIC_PREFIX } from "@/lib/instagram/images/constants";
import { gradientStops, templateStyleForSlide } from "./templates";
import type { ArtDimensions, ArtTemplateId, BrandColors, BrandFonts, SlideRenderInput } from "./types";

function escXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function truncate(s: string, max: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

function wrapLines(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = w;
    } else {
      line = next;
    }
    if (lines.length >= maxLines) break;
  }
  if (line && lines.length < maxLines) lines.push(line);
  return lines.slice(0, maxLines);
}

function buildOverlaySvg(
  slide: SlideRenderInput,
  dims: ArtDimensions,
  colors: BrandColors,
  fonts: BrandFonts,
  templateId: ArtTemplateId,
  companyName: string,
  logoDataUri?: string
): string {
  const style = templateStyleForSlide(slide.slideType, templateId, colors);
  const [g0, g1] = gradientStops(templateId, colors, slide.slideType);
  const headline = escXml(truncate(slide.headline, 90));
  const bodyLines = wrapLines(slide.body, 38, 6).map(escXml);
  const headlineSize = dims.height >= 1800 ? 56 : dims.width >= 1080 && dims.height > 1080 ? 48 : 42;
  const bodySize = dims.height >= 1800 ? 30 : 26;
  const pad = 64;
  const bodyY = pad + headlineSize + 36;
  const tspans = bodyLines.map((l, i) => `<tspan x="${pad}" dy="${i === 0 ? 0 : bodySize + 8}">${l}</tspan>`).join("");

  const logoBlock = logoDataUri
    ? `<image href="${logoDataUri}" x="${dims.width - pad - 120}" y="${pad}" width="120" height="48" preserveAspectRatio="xMidYMid meet"/>`
    : `<text x="${dims.width - pad}" y="${pad + 28}" text-anchor="end" font-family="${fonts.heading}" font-size="22" font-weight="700" fill="${style.headlineColor}">${escXml(companyName)}</text>`;

  const accentBar = style.accentBar
    ? `<rect x="${pad}" y="${pad - 12}" width="72" height="6" rx="3" fill="${colors.accent}"/>`
    : "";

  return `<svg width="${dims.width}" height="${dims.height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${g0}"/>
      <stop offset="100%" stop-color="${g1}"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <rect width="100%" height="100%" fill="#0f172a" opacity="${1 - style.overlayOpacity}"/>
  ${accentBar}
  ${logoBlock}
  <text x="${pad}" y="${pad + headlineSize}" font-family="${fonts.heading}" font-size="${headlineSize}" font-weight="800" fill="${style.headlineColor}">${headline}</text>
  <text x="${pad}" y="${bodyY}" font-family="${fonts.body}" font-size="${bodySize}" fill="${style.bodyColor}">${tspans}</text>
  <text x="${pad}" y="${dims.height - pad}" font-family="${fonts.body}" font-size="20" fill="${style.bodyColor}" opacity="0.85">@${escXml(companyName.toLowerCase().replace(/\s+/g, ""))} · slide ${slide.order}</text>
</svg>`;
}

async function loadImageBuffer(storageKey: string | null, url: string): Promise<Buffer | null> {
  if (storageKey) {
    const p = path.join(process.cwd(), "public", "uploads", "instagram", storageKey);
    try {
      return await readFile(p);
    } catch {
      /* fallthrough */
    }
  }
  if (url.startsWith(UPLOAD_PUBLIC_PREFIX)) {
    const key = url.replace(`${UPLOAD_PUBLIC_PREFIX}/`, "");
    try {
      return await readFile(path.join(process.cwd(), "public", "uploads", "instagram", key));
    } catch {
      return null;
    }
  }
  return null;
}

async function loadLogoDataUri(logoUrl: string | null | undefined): Promise<string | undefined> {
  if (!logoUrl) return undefined;
  if (logoUrl.startsWith(UPLOAD_PUBLIC_PREFIX)) {
    const buf = await loadImageBuffer(logoUrl.replace(`${UPLOAD_PUBLIC_PREFIX}/`, ""), logoUrl);
    if (!buf) return undefined;
    const meta = await sharp(buf).metadata();
    const mime = meta.format === "png" ? "image/png" : "image/jpeg";
    return `data:${mime};base64,${buf.toString("base64")}`;
  }
  return undefined;
}

export async function renderSlideArt(opts: {
  slide: SlideRenderInput;
  dims: ArtDimensions;
  colors: BrandColors;
  fonts: BrandFonts;
  templateId: ArtTemplateId;
  companyName: string;
  logoUrl?: string | null;
  photoStorageKey?: string | null;
  photoUrl?: string;
  outputMime: "image/png" | "image/jpeg";
}): Promise<Buffer> {
  const overlay = buildOverlaySvg(
    opts.slide,
    opts.dims,
    opts.colors,
    opts.fonts,
    opts.templateId,
    opts.companyName,
    await loadLogoDataUri(opts.logoUrl)
  );

  const { width, height } = opts.dims;
  let base: sharp.Sharp;

  const photoBuf =
    opts.photoStorageKey || opts.photoUrl
      ? await loadImageBuffer(opts.photoStorageKey ?? null, opts.photoUrl ?? "")
      : null;

  if (photoBuf) {
    base = sharp(photoBuf).resize(width, height, { fit: "cover", position: "centre" });
  } else {
    base = sharp(Buffer.from(overlay)).resize(width, height);
    if (opts.outputMime === "image/jpeg") {
      return base.jpeg({ quality: 90 }).toBuffer();
    }
    return base.png().toBuffer();
  }

  const overlayBuf = await sharp(Buffer.from(overlay)).png().toBuffer();
  const composed = await base
    .composite([{ input: overlayBuf, top: 0, left: 0 }])
    .toBuffer();

  if (opts.outputMime === "image/jpeg") {
    return sharp(composed).jpeg({ quality: 90 }).toBuffer();
  }
  return sharp(composed).png().toBuffer();
}
