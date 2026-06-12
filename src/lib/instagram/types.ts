import type { IgContentType, IgPostFormat, InstagramBrandConfig, InstagramPersona, InstagramService } from "@prisma/client";

export type BrandContext = InstagramBrandConfig & {
  personas: InstagramPersona[];
  services?: InstagramService[];
};

export type GeneratedIdea = {
  title: string;
  idea: string;
  contentType: IgContentType;
  format: IgPostFormat;
  suggestedPersona?: string;
};

export type GeneratedCaption = {
  version: "A" | "B";
  hook: string;
  body: string;
  cta: string;
  hashtags: string;
  fullText: string;
};

export type CritiqueResult = {
  score: number;
  sells: boolean;
  verdict: string;
  issues: string[];
  suggestions: string[];
  strengths: string[];
};

export type CalendarDayPlan = {
  date: Date;
  dayLabel: string;
  dayTheme: string;
  contentType: IgContentType;
  format: IgPostFormat;
  idea: GeneratedIdea;
};
