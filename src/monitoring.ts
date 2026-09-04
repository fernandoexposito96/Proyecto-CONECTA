export async function initMonitoring() {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) return;

  const Sentry = await import('@sentry/react');
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    enabled: Boolean(dsn),
    sendDefaultPii: false,
    tracesSampleRate: 0.1,
  });
}
