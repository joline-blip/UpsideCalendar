import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  APP_BASE_URL: z.string().url().optional(),
  MAGIC_LINK_SECRET: z.string().min(16).optional(),
  EMAIL_FROM: z.string().min(3).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  ADMIN_EMAILS: z.string().optional(), // comma-separated
  AVAILABILITY_CUTOFF_HOURS: z.coerce.number().int().positive().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).optional(),
});

export type Env = z.infer<typeof schema>;

export function env(): Env {
  // Next.js: only read server-side
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    // Keep message short; the Zod error is enough for debugging.
    throw new Error(`Invalid environment: ${parsed.error.message}`);
  }
  return parsed.data;
}

export function isProd() {
  return process.env.NODE_ENV === "production";
}

