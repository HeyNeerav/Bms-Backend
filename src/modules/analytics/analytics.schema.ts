import { z } from "zod";

export const ANALYTICS_PERIODS = [
  "7d",
  "30d",
  "90d",
  "12m",
  "thisYear",
  "lastYear",
  "lifetime",
] as const;

export const analyticsQuerySchema = z.object({
  period: z.enum(ANALYTICS_PERIODS).default("30d"),
});

export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;
