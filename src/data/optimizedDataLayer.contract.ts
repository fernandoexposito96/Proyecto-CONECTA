import type { OptimizedStateSetters } from "./optimizedDataLayer.integration";
import { createOptimizedActions } from "./optimizedDataLayer.integration";

// Lightweight exported contract used by TypeScript/build validation.
// Runtime behavior remains opt-in until App.tsx switches to this adapter.
export type { OptimizedStateSetters };
export { createOptimizedActions };
