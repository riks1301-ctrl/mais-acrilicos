import { z } from "zod";

export const metaSettingsSchema = z.object({
  metaPageId: z.string().optional(),
  metaIgUserId: z.string().optional(),
  metaAppId: z.string().optional(),
  metaMode: z.enum(["DISABLED", "TEST", "ACTIVE"]).optional(),
  metaAutoPublish: z.boolean().optional(),
  metaTokenExpiresAt: z.union([z.string(), z.null()]).optional(),
  accessToken: z.string().optional(),
  clearStoredToken: z.boolean().optional(),
});

export const publishMetaSchema = z.object({
  confirm: z.literal(true, { errorMap: () => ({ message: "Confirmação obrigatória" }) }),
});
