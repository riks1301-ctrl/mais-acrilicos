import type { IgMetaMode } from "@prisma/client";

export type MetaGraphHost = "instagram" | "facebook";

export type MetaConfig = {
  apiVersion: string;
  graphHost: MetaGraphHost;
  appId: string | null;
  appSecret: string | null;
  pageId: string | null;
  igBusinessAccountId: string | null;
  accessToken: string | null;
  mode: IgMetaMode;
  autoPublish: boolean;
  tokenExpiresAt: Date | null;
};

export type MetaValidationResult = {
  ok: boolean;
  errors: string[];
  warnings: string[];
  account?: { id: string; username?: string; name?: string };
};

export type MetaPublishResult = {
  ok: boolean;
  testMode: boolean;
  mediaContainerId?: string;
  mediaId?: string;
  error?: string;
  sanitizedError?: string;
};

export type MetaGraphError = {
  message: string;
  type?: string;
  code?: number;
  error_subcode?: number;
  fbtrace_id?: string;
};
