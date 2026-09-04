import { describe, expect, it } from "vitest";
import {
  demoCommunities,
  demoPlans,
  demoProfiles,
  isDemoEntityId,
  mergeDemoCommunities,
  mergeDemoPlans,
  mergeDemoProfiles,
} from "../../src/demoMode";
import {
  distanceKm,
  formatAtmosphere,
  formatLevel,
  formatMoney,
  mapEmbedUrl,
  personCompatibility,
  planCompatibility,
} from "../../src/utils";

describe("domain presentation utilities", () => {
  it("formats price, level and atmosphere for Spanish users", () => {
    expect(formatMoney(0)).toBe("Gratis");
    expect(formatMoney(1250)).toMatch(/12,50\s?€/);
    expect(formatLevel("beginner")).toBe("Principiante");
    expect(formatAtmosphere("calm")).toBe("Tranquilo");
  });

  it("calculates geographic distance and handles unavailable coordinates", () => {
    expect(distanceKm(null, 1.24, 41.1, 1.25)).toBeNull();
    expect(distanceKm(41.1189, 1.2445, 41.1189, 1.2445)).toBe(0);
    expect(distanceKm(41.1189, 1.2445, 41.3851, 2.1734)).toBeGreaterThan(80);
  });

  it("keeps compatibility scores bounded", () => {
    const profile = demoProfiles[0];
    expect(planCompatibility(demoPlans[0], profile)).toBeGreaterThanOrEqual(55);
    expect(planCompatibility(demoPlans[0], profile)).toBeLessThanOrEqual(99);
    expect(personCompatibility(demoProfiles[1], profile)).toBeLessThanOrEqual(99);
  });

  it("generates an encoded OpenStreetMap embed URL", () => {
    const url = mapEmbedUrl(demoPlans[0]);
    expect(url).toMatch(/^https:\/\/www\.openstreetmap\.org\/export\/embed\.html\?/);
    expect(url).toContain("bbox=");
  });
});

describe("demo data boundaries", () => {
  it("recognizes demo ids without matching production ids", () => {
    expect(isDemoEntityId(demoPlans[0].id)).toBe(true);
    expect(isDemoEntityId("0da81f31-592d-43af-a75d-44b5469ca91e")).toBe(false);
    expect(isDemoEntityId(null)).toBe(false);
  });

  it("does not inject demo data when the mode is disabled", () => {
    expect(mergeDemoPlans([], false)).toEqual([]);
    expect(mergeDemoProfiles([], false)).toEqual([]);
    expect(mergeDemoCommunities([], false)).toEqual([]);
  });

  it("injects each demo collection once when enabled", () => {
    expect(mergeDemoPlans(demoPlans, true)).toHaveLength(demoPlans.length);
    expect(mergeDemoProfiles(demoProfiles, true)).toHaveLength(demoProfiles.length);
    expect(mergeDemoCommunities(demoCommunities, true)).toHaveLength(demoCommunities.length);
  });
});
