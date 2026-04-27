import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod/v4";

export const env = createEnv({
  shared: {
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
  },
  server: {
    POSTGRES_URL: z.string().optional(),
    /** Public origin for Better Auth (e.g. https://getclassica.com). Required for Discord OAuth when the canonical URL is a custom domain; Vercel’s default `*.vercel.app` redirect_uri will not match Discord if you only registered the custom domain. */
    AUTH_URL: z.string().url().optional(),
    AUTH_SECRET: z.string().optional(),
    AUTH_DISCORD_ID: z.string().optional(),
    AUTH_DISCORD_SECRET: z.string().optional(),
    AUTH_GOOGLE_ID: z.string().optional(),
    AUTH_GOOGLE_SECRET: z.string().optional(),
    ELEVENLABS_STS_API_KEY: z.string().optional(),
    OPENAI_API_KEY: z.string().optional(),
    STRIPE_SECRET_KEY: z.string().optional(),
    PORT: z.string().optional(),
    VERCEL_ENV: z.string().optional(),
    VERCEL_URL: z.string().optional(),
    VERCEL_PROJECT_PRODUCTION_URL: z.string().optional(),
    CRON_SECRET: z.string().optional(),
    ADMIN_PASSWORD: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  },
  experimental__runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  },
  skipValidation:
    !!process.env.CI ||
    !!process.env.VERCEL ||
    process.env.npm_lifecycle_event === "lint",
});
