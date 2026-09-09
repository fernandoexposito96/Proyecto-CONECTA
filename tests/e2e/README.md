# Browser QA of the preserved demo

Run `npm ci`, `npx playwright install chromium webkit`, `npm run build`, then
`npm run test:e2e`. CI also installs the operating-system browser dependencies.
Use the project's Node 22 runtime.

Every test opens a new browser context. `fixtures.ts` intercepts all requests:
only the local preview may reach a server; Supabase responses are synthesized
in memory, and all other remote requests are blocked. Fixture identities and
mutations never reach real accounts or a real database. These tests prove the
client flows, not production RLS, authentication delivery or backend health.

The served HTML must exactly match this checkout's `dist/index.html`; an old
preview from another working copy is rejected. Service workers are blocked to
avoid a cached build silently replacing the application under test.

Current coverage: navigation across the main demo views, image decoding and
fallback detection, viewport overflow, category navigation, profile editing
and persistence, cross-view blocking, people filters and likes, and serious/critical accessibility checks on Home. This runs
on desktop Chromium, mobile Chromium and iPhone WebKit. Screenshots and traces
are available in the HTML report and CI's `browser-evidence` artifact.

Coverage still to add: the full responsive width matrix, nested settings,
creation, privacy preferences/unblocking, chat interactions, authentication failure paths,
and PWA behavior. This suite must not be presented as exhaustive functional QA.
