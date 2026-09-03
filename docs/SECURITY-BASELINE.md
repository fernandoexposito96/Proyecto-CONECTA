# CONECTA security baseline

## Supabase

- Production project: `qdjuypoqiafqncwgmicf` (EU).
- The browser uses only the Supabase publishable key. Never place a service-role key in client code.
- RLS migrations in `supabase/migrations/` are part of the production security baseline and must remain versioned.
- Authentication sessions are refreshed automatically and revalidated when the app returns to the foreground.

## Release security checks

Before a production release:

1. Run `npm run check`.
2. Run `npm run build`.
3. Run `npm run test:smoke`.
4. Confirm GitHub Actions `CONECTA Validate` is green on the exact commit being merged.
5. Review Supabase Security Advisor and resolve new warnings before release.
6. Confirm leaked-password protection is enabled in Supabase Auth when the project plan/configuration supports it.

## Client configuration

`VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` may override the production defaults. The publishable key is intentionally public; privileged credentials must only exist server-side.

## Database changes

All security-sensitive SQL changes must be additive, reviewable migrations. Do not rewrite migration history after it has been applied to production.
