export type LifeActivitySourceKind = "demo-fixture" | "provider" | "unavailable";

export type LifeMetricKey = "steps" | "activeMinutes" | "workouts" | "socialPlans";

export type LifeActivitySnapshot = {
  source: LifeActivitySourceKind;
  metrics: ReadonlyArray<{ key: LifeMetricKey; label: string; value: string; goal: string }>;
  weeklyDistance: string;
  weeklyComparison: string;
  weeklyBars: ReadonlyArray<number>;
  challenge: { eyebrow: string; title: string; description: string; progress: string };
};

/**
 * Approved visual fixture. It is deliberately identified as demo data so these
 * values cannot be mistaken for measurements from a health provider.
 */
export const DEMO_LIFE_ACTIVITY: LifeActivitySnapshot = {
  source: "demo-fixture",
  metrics: [
    { key: "steps", label: "Pasos", value: "8.642", goal: "de 10.000" },
    { key: "activeMinutes", label: "Actividad", value: "64", goal: "minutos" },
    { key: "workouts", label: "Entrenos", value: "4", goal: "esta semana" },
    { key: "socialPlans", label: "Planes activos", value: "3", goal: "con otras personas" },
  ],
  weeklyDistance: "18,7 km recorridos",
  weeklyComparison: "Un 24% más que la semana pasada.",
  weeklyBars: [42, 68, 54, 88, 72, 96, 65],
  challenge: {
    eyebrow: "RETO ACTIVO",
    title: "Semana imparable",
    description: "Completa 5 actividades con otras personas.",
    progress: "4 de 5",
  },
};
