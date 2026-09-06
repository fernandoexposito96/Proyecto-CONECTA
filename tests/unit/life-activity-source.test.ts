import { describe, expect, it } from "vitest";
import { DEMO_LIFE_ACTIVITY } from "../../src/data/lifeActivity";

describe("Conecta Vida activity source", () => {
  it("marks all approved placeholder health metrics as demo fixtures", () => {
    expect(DEMO_LIFE_ACTIVITY.source).toBe("demo-fixture");
    expect(DEMO_LIFE_ACTIVITY.metrics.map((metric) => metric.key)).toEqual([
      "steps",
      "activeMinutes",
      "workouts",
      "socialPlans",
    ]);
  });

  it("keeps weekly chart values bounded", () => {
    expect(DEMO_LIFE_ACTIVITY.weeklyBars).toHaveLength(7);
    expect(DEMO_LIFE_ACTIVITY.weeklyBars.every((value) => value >= 0 && value <= 100)).toBe(true);
  });
});
