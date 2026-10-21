# Playwright E2E Portfolio — Sample Suite

A small, clean end-to-end test suite built with **Playwright + TypeScript**, written to show how I structure automation work for clients on Fiverr.

It runs against the public demo app **https://demo.playwright.dev/todomvc** (no login required), so anyone can clone and run it in minutes.

## What this sample demonstrates

- **Page Object Model** — selectors and actions live in `pages/`, tests stay readable (`tests/`).
- **Stable, intention-revealing selectors** — roles, test-ids and placeholders instead of brittle CSS.
- **Real assertions** — state is verified (counts, completed state, persistence), not just "page loaded".
- **HTML reporting** — a shareable report after every run.
- **CI integration** — tests run automatically on every push via GitHub Actions (`.github/workflows/playwright.yml`).

## Project structure

```
playwright-portfolio/
├── pages/
│   └── TodoPage.ts        # Page Object: all interactions with the app
├── tests/
│   ├── todo.spec.ts       # Core flows: add, complete, delete, filter
│   └── persistence.spec.ts# State persists after reload
├── playwright.config.ts   # Config: base URL, reporter, retries, browsers
├── package.json
├── tsconfig.json
└── .github/workflows/playwright.yml
```

## How to run

```bash
npm install
npx playwright install        # downloads browsers (first time only)
npx playwright test           # run all tests
npx playwright show-report    # open the HTML report
```

## Notes

This is a deliberately small sample. A real client suite would cover your own flows (login, checkout, forms, dashboards), handle test data and environments, and plug into your CI. That's exactly what my Fiverr gigs deliver.
