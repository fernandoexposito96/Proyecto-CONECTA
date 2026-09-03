import type { Community, Plan, Profile } from "./types";

// Producción limpia: el modo demo queda desactivado y no mezcla contenido ficticio.
export const DEMO_MODE_DEFAULT = false;
export const demoProfiles: Profile[] = [];
export const demoPlans: Plan[] = [];
export const demoCommunities: Community[] = [];

export function isDemoModeEnabled() {
  return false;
}

export function setDemoModeEnabled(_enabled: boolean) {
  // Intencionadamente desactivado en producción.
}

export function mergeDemoPlans(real: Plan[], _enabled: boolean) {
  return real;
}

export function mergeDemoProfiles(real: Profile[], _enabled: boolean) {
  return real;
}

export function mergeDemoCommunities(real: Community[], _enabled: boolean) {
  return real;
}
