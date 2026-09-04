# NORA browser tests

These tests exercise CONECTA in real browsers using Playwright and Axe.

They verify startup, fatal browser errors, mobile overflow, basic control naming, accessibility severity and invalid empty links. Chromium and iPhone/WebKit are both included by the Playwright configuration.

Run locally with `npm run test:e2e` after installing Playwright browsers with `npx playwright install --with-deps chromium webkit`.
