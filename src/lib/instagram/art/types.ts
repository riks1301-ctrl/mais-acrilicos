export type ArtTemplateId = "carousel" | "oferta" | "bastidores" | "institucional";

export type BrandColors = {
  primary: string;
  secondary: string;
  accent: string;
  background?: string;
  text?: string;
};

export type BrandFonts = {
  heading: string;
  body: string;
};

export type ArtDimensions = {
  width: number;
  height: number;
  format: string;
};

export type SlideRenderInput = {
  order: number;
  slideType: string;
  headline: string;
  body: string;
};

export type RenderedArtFile = {
  imageId: string;
  url: string;
  storageKey: string;
  role: string;
  order: number;
  format: string;
  mimeType: string;
  source: "real_photo" | "brand_template";
};

export type GenerateArtResult = {
  files: RenderedArtFile[];
  usedRealPhotos: number;
  usedTemplates: number;
  skippedAi: boolean;
  canvaSpec: unknown;
};
