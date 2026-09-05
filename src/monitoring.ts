async function getMonitoring() {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) return null;
  return import('@sentry/react');
}

export async function initMonitoring() {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) return;

  const Sentry = await getMonitoring();
  if (!Sentry) return;
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    enabled: true,
    sendDefaultPii: false,
    tracesSampleRate: 0.1,
  });
}

export async function captureMonitoringError(error: unknown, area: string) {
  const Sentry = await getMonitoring();
  if (!Sentry) return;
  Sentry.captureException(error, { tags: { area } });
}
