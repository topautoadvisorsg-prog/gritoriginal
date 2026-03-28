import * as Sentry from "@sentry/react";

export const logClientError = (context: { location: string; action: string; error: string }) => {
  console.error(`[CLIENT_ERROR] ${context.location}:${context.action}`, context.error);
  
  Sentry.captureMessage(`UI Error: ${context.action}`, {
    level: "error",
    extra: context,
  });
};

export const trackMetric = (name: string, value: number = 1) => {
  // Logic for frontend metrics (e.g. mixpanel or google analytics)
  console.log(`[FRONTEND_METRIC] ${name}=${value}`);
};
