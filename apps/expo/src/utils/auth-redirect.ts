import type { Href } from "expo-router";
import { router } from "expo-router";

import { DEFAULT_AUTH_CALLBACK } from "./auth";

function normalizeCallback(callbackUrl?: string) {
  if (!callbackUrl) return DEFAULT_AUTH_CALLBACK;
  return callbackUrl.startsWith("/") ? callbackUrl : DEFAULT_AUTH_CALLBACK;
}

export function toSignInHref(callbackUrl?: string): Href {
  return {
    pathname: "/sign-in",
    params: { callbackUrl: normalizeCallback(callbackUrl) },
  };
}

export function pushSignIn(callbackUrl?: string) {
  router.push(toSignInHref(callbackUrl));
}
