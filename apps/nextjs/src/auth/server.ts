import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { nextCookies } from "better-auth/next-js";

import { initAuth } from "@acme/auth";

import { env } from "~/env";

const authUrl = env.AUTH_URL?.replace(/\/$/, "");

/**
 * Without `AUTH_URL`, production uses `VERCEL_PROJECT_PRODUCTION_URL` (often `*.vercel.app`).
 * OAuth providers require `redirect_uri` to match the portal **exactly**, so if Discord only
 * lists `https://getclassica.com/...` but the app uses `https://<project>.vercel.app/...`, login fails.
 */
const baseUrl =
  authUrl ??
  (env.VERCEL_ENV === "production"
    ? env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000"
    : env.VERCEL_URL
      ? `https://${env.VERCEL_URL}`
      : "http://localhost:3000");

const productionUrl = authUrl
  ? undefined
  : env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`
    : undefined;

export const auth = initAuth({
  baseUrl,
  productionUrl,
  secret: env.AUTH_SECRET,
  discordClientId: env.AUTH_DISCORD_ID,
  discordClientSecret: env.AUTH_DISCORD_SECRET,
  googleClientId: env.AUTH_GOOGLE_ID,
  googleClientSecret: env.AUTH_GOOGLE_SECRET,
  extraPlugins: [nextCookies()],
});

export const getSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);
