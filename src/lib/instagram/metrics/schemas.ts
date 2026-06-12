import { z } from "zod";

export const syncMetricsSchema = z.object({
  limit: z.coerce.number().min(1).max(25).optional(),
  postId: z.string().optional(),
});

export const demoSeedSchema = z.object({
  confirm: z.literal(true),
});
