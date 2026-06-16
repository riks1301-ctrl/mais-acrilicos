import JSZip from "jszip";
import { PDFDocument } from "pdf-lib";
import { loadStorageBuffer } from "@/lib/instagram/images/blob";

async function getSharp() {
  const mod = await import("sharp");
  return mod.default;
}

export type ArtExportFile = {
  storageKey: string;
  order: number;
  role: string;
  filename: string;
};

async function loadPngBuffer(storageKey: string): Promise<Buffer> {
  return loadStorageBuffer(storageKey);
}

export async function exportArtAsZip(files: ArtExportFile[]): Promise<Buffer> {
  const zip = new JSZip();
  for (const f of files.sort((a, b) => a.order - b.order)) {
    const buf = await loadPngBuffer(f.storageKey);
    zip.file(f.filename.replace(/\.[^.]+$/, ".png"), buf);
  }
  return zip.generateAsync({ type: "nodebuffer" });
}

export async function exportArtAsJpgZip(files: ArtExportFile[]): Promise<Buffer> {
  const sharp = await getSharp();
  const zip = new JSZip();
  for (const f of files.sort((a, b) => a.order - b.order)) {
    const buf = await loadPngBuffer(f.storageKey);
    const jpg = await sharp(buf).jpeg({ quality: 90 }).toBuffer();
    zip.file(f.filename.replace(/\.[^.]+$/, ".jpg"), jpg);
  }
  return zip.generateAsync({ type: "nodebuffer" });
}

export async function exportArtAsPdf(files: ArtExportFile[]): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  const sorted = [...files].sort((a, b) => a.order - b.order);

  for (const f of sorted) {
    const pngBuf = await loadPngBuffer(f.storageKey);
    const image = await pdf.embedPng(pngBuf);
    const page = pdf.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
  }

  return Buffer.from(await pdf.save());
}

export async function exportSingleFile(storageKey: string, format: "png" | "jpg"): Promise<{ buffer: Buffer; mime: string; ext: string }> {
  const png = await loadPngBuffer(storageKey);
  if (format === "jpg") {
    const sharp = await getSharp();
    return { buffer: await sharp(png).jpeg({ quality: 90 }).toBuffer(), mime: "image/jpeg", ext: ".jpg" };
  }
  return { buffer: png, mime: "image/png", ext: ".png" };
}
