import posthog from "posthog-js";

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const POSTHOG_HOST = (import.meta.env.VITE_POSTHOG_HOST as string) || "https://us.i.posthog.com";
const IS_PRODUCTION = import.meta.env.PROD;
const FORCE_ENABLE = import.meta.env.VITE_POSTHOG_ENABLE === "true";

let initialized = false;

export function initPostHog() {
  if (initialized) return;
  if (!POSTHOG_KEY) return;
  if (!IS_PRODUCTION && !FORCE_ENABLE) return;

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: false,
    capture_pageleave: true,
    persistence: "localStorage",
  });

  initialized = true;
}

export function capturePageView(path: string) {
  if (!initialized) return;
  posthog.capture("$pageview", { $current_url: window.location.origin + path });
}

export function identifyUser(userId: string, traits?: Record<string, unknown>) {
  if (!initialized) return;
  posthog.identify(userId, traits);
}

export function resetUser() {
  if (!initialized) return;
  posthog.reset();
}

export function trackEvent(eventName: string, properties?: Record<string, unknown>) {
  if (!initialized) return;
  posthog.capture(eventName, properties);
}
