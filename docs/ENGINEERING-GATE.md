# CONECTA engineering gate

This document defines the permanent engineering bar for changes after 1.0.

## Required on every release candidate

- TypeScript check passes.
- Lint passes without warnings.
- Unit and end-to-end tests pass in Chromium and WebKit/iPhone.
- Production build passes.
- Smoke tests pass.
- No temporary migration/refactor workflows are left enabled after their work is integrated.
- No obsolete `Index1996` or `raw.githack` references.
- No blocking browser prompts in product flows.
- Hot Supabase reads use explicit projections rather than unbounded `select('*')`.
- Public tables keep RLS enabled and browser roles follow least privilege.
- Security-sensitive database changes remain versioned as migrations.

## Architecture direction

`src/App.tsx` is still a legacy composition root and must not absorb new product domains. New work should be implemented in focused components, hooks, services or data modules and wired into App only at the composition boundary. Existing UI must be extracted incrementally only when covered by the validation gate; avoid large visual rewrites solely to reduce file size.

## Permanent workflows

Only reusable CI/deployment workflows belong in `.github/workflows/`. One-off transformation workflows must be removed before their pull request is merged.

## Release principle

A green build is necessary but not sufficient: authentication, primary navigation, plan membership, connections, chat, profile/session exit and installed-PWA behavior should be exercised as end-to-end release checks whenever those flows change.
