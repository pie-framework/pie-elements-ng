# PIE A11y Docs Working Model

This directory is the repo-side workspace for PIE accessibility audit and remediation planning. It exists so product, accessibility, QA, and engineering can work from the same artifacts while keeping Confluence, Jira, and code responsibilities distinct.

## Source Of Truth

| Surface | Owns | Does not own |
| --- | --- | --- |
| Repo docs in `docs/a11y` | Element coverage, scenario IDs, automated/manual boundaries, code-adjacent audit notes | Sprint status, ownership, release commitments |
| Repo PRDs in `docs/prds` | Proposed or accepted product contracts for element changes | Retroactive docs for stable behavior |
| Jira | Work state, assignee, sprint/release tracking, canonical ticket discussion | Detailed model/session contracts |
| Confluence | Program rollups, stakeholder-facing group status, links to repo/Jira | Canonical code-adjacent behavior |

## Sync Model

Confluence pages use managed sections generated from this repo and PM-editable sections maintained in Confluence.

- Repo-to-Confluence sync updates only managed summary blocks.
- Confluence-to-repo sync pulls only explicit status fields into structured local metadata.
- The sync tool must not overwrite freeform PM notes or stakeholder discussion.
- If sync markers are missing or ambiguous, stop and resolve manually.

## How Engineers Use This

- Start with [`TRACKING.md`](./TRACKING.md) for the full element matrix.
- Use [`INITIATIVE-MAP.md`](./INITIATIVE-MAP.md) to understand how repo elements map to Confluence initiative groups.
- Use each `docs/a11y/<element>.md` file when adding or reviewing a11y scenarios.
- Treat generated Confluence pages as a publishing surface, not as the canonical source for scenario definitions.
- When implementation changes require synced React packages, follow the upstream sync policy instead of editing generated outputs directly.

## How Product Managers Use This

- Work primarily in Confluence and Jira for initiative status, sequencing, scope, and acceptance discussions.
- Ask an agent to pull relevant repo context before drafting or updating tickets.
- Use [`_audit-template.md`](./_audit-template.md) for consistent element audit entries.
- For product changes that alter element behavior, ask the agent to draft or update a PRD under `docs/prds/<slug>/PRD.md`.
- Link Jira tickets to the relevant repo docs and Confluence group pages.

## Common Agent Prompts

```text
Read docs/a11y/INITIATIVE-MAP.md, docs/a11y/<element>.md, and Jira PIE-123.
Draft an audit update with WCAG gaps, severity, effort, sequencing, validation status, and open questions.
Do not edit code.
```

```text
Use docs/prds/_template.md and docs/prds/README.md.
Draft a Proposal PRD for <feature> linked to PIE-123.
Keep it short and include accessibility requirements and open questions.
Do not implement anything.
```

## Sync Commands

- `bun run a11y:confluence:check` reports missing/stale Confluence mappings.
- `bun run a11y:confluence:bootstrap -- --apply` creates missing Confluence pages and records IDs.
- `bun run a11y:confluence:push -- --apply` publishes repo-managed summaries.
- `bun run a11y:confluence:pull-status -- --apply` pulls PM-editable status metadata.

All write commands default to dry-run unless `--apply` is passed.
