# CONECTA 1.0 — Final release gate

This file marks the final 1.0 release candidate.

## Required gate

The exact release commit must pass the repository `CONECTA Validate` workflow before it is merged into `main`.

Validation includes:

- TypeScript check
- Production build
- Automated smoke tests

## Release baseline

The 1.0 candidate includes the completed performance/data-loading work, Supabase payload optimization, mobile/UI polish, targeted action refreshes, and the documented backend/security baseline.

## Deployment sanity check

After merge to `main`, verify the production deployment and PWA entry files (`index.html`, manifest and service worker) resolve from the canonical Proyecto-CONECTA deployment without references to obsolete repositories or preview deployments.
