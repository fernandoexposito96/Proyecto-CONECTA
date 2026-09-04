import { describe, expect, it } from 'vitest';

describe('monitoring guard', () => {
  it('keeps Sentry optional when no DSN is configured', () => {
    const dsn = import.meta.env.VITE_SENTRY_DSN;
    expect(Boolean(dsn)).toBe(false);
  });
});
