# PIE Element Axe Accessibility Scenarios

This suite mounts dedicated WCAG 2.2 AA-oriented accessibility scenarios under `/a11y`.
Each scenario describes the specific concern it exercises, the WCAG criteria it maps to,
and the automated checks that can be run safely in Playwright.

## Run

```bash
bun run test:a11y
```

Useful filters:

```bash
A11Y_ELEMENT=multiple-choice bun run test:a11y
A11Y_ELEMENT=multiple-choice A11Y_SCENARIO=single-select-radio-group bun run test:a11y
A11Y_CONCERN=keyboard-focus bun run test:a11y
A11Y_MAX_TARGETS=10 bun run test:a11y
```

The broad demo-shadow inventory remains available as an explicit baseline:

```bash
bun run test:a11y:inventory
A11Y_SUITE=inventory A11Y_ELEMENT=multiple-choice bun run test:a11y
```

The Playwright config starts the demo app automatically. If you already have the demo running, set `PIE_A11Y_EXTERNAL_SERVER=1`.

## Reports

Reports are written to `apps/element-a11y-demo/test-results/a11y/`:

- `axe-a11y-scenarios-report.json`: machine-readable scenario coverage and findings.
- `axe-a11y-scenarios-report.md`: human-readable scenario summary grouped by element and concern.
- `axe-a11y-report.json`: stable machine-readable inventory and findings.
- `axe-a11y-report.md`: human-readable summary grouped by element and finding.
- `playwright-a11y-report/scenarios/` and `playwright-a11y-report/inventory/`: HTML
  reports when those suites are run.

When a run is started from the local demo UI, reports are written under
`apps/element-a11y-demo/test-results/a11y/runs/<run-id>/` and linked directly from the page
that started the run. The primary UI link opens a formatted Svelte report; raw JSON,
Markdown, and Playwright HTML links remain available from that report page.

The suite records Axe violations and scenario-check failures but does not assert on them yet.
Set `A11Y_ENFORCE=1` to make curated scenario findings fail locally when experimenting
with future gating.

Each finding includes:

- Element, scenario, purpose, WCAG criteria, concern tags, mode, role, and repro route.
- Axe rule ID, impact, help URL, tags, selector target, and HTML context.
- Scenario check failures for keyboard reachability, accessible names, target sizing, or
  status-message presence when those checks apply.
- Suggested Jira title for follow-up remediation work.

## A11y Mount

Open `/a11y` in the demo app to browse the curated scenario suite. Individual scan routes look like:

```text
/a11y/<element>/scan?scenario=<scenario-id>&player=esm
```

Open `/a11y/inventory` to browse the broad demo baseline. Inventory scan routes remain:

```text
/a11y/<element>/scan?demo=<demo-id>&mode=gather&player=esm
/a11y/<element>/scan?demo=<demo-id>&mode=evaluate&player=esm
```

These routes intentionally avoid the normal demo chrome so Axe scans focus on the mounted assessment element.

In local dev mode, `/a11y` includes a “Run full a11y suite” control. Individual scan
pages include controls to run just that scenario or all scenarios for the element. These
controls call dev-only SvelteKit endpoints that spawn the same Playwright commands used
above. They are intentionally unavailable outside local dev mode.

## CI

The `A11y Scenarios` GitHub workflow is **non-blocking**: the job uses
`continue-on-error: true`, so Axe findings never fail a check. What runs depends on the
trigger:

- **Every pull request** to `master`/`develop` runs the curated **scenarios only**
  (fast per-PR feedback).
- **Release PRs into `master`** (e.g. a `develop` -> `master` PR) and **manual
  `workflow_dispatch`** additionally run the broad **inventory baseline** — the full
  release-boundary sweep. The inventory step is skipped on regular PRs into `develop`.

In every case it then:

- writes the Markdown summary to the GitHub Actions **job step summary**, so violations
  are readable directly on the workflow run page without downloading anything, and
- uploads the JSON, Markdown, and Playwright HTML reports as the `axe-a11y-reports`
  artifact (30-day retention) for full detail — selectors, DOM context, and suggested
  Jira titles.

The workflow honors the shared `[skip-heavy-ci]` PR label/title (and skips
`changeset-release/*` branches), the same escape hatch used by `ci.yml`.

Do not make it a required build/deploy gate until scenario findings and the inventory
baseline have been triaged. To promote toward blocking, run the suite with
`A11Y_ENFORCE=1` so curated scenario findings fail.
