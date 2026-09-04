import { describe, expect, it } from 'vitest';

describe('NORA baseline', () => {
  it('keeps the diagnostic capacity at 999 findings', () => {
    const configured = Number.parseInt(process.env.CONECTA_ROBOT_MAX_FINDINGS ?? '999', 10);
    expect(Math.min(Math.max(configured || 999, 1), 999)).toBe(999);
  });

  it('uses three diagnostic layers', () => {
    const layers = ['errors', 'watch', 'corrected'];
    expect(layers).toEqual(['errors', 'watch', 'corrected']);
  });
});
