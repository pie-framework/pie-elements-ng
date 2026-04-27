---
name: pie-prd-author
description: Drafts or updates a PIE element PRD following the project conventions in docs/prds/README.md. Use when starting a new element that meets the PRD bar, or when a substantial change requires updating an existing PRD.
allowed-tools: Read, Write, Edit, Glob, Grep
---

# PIE PRD Author

Drafts or updates a PRD for a new element or substantial feature change.

## When a PRD Is Required

From `CLAUDE.md` (verbatim):

> - New elements (net-new `@pie-element/*` packages or substantial new interaction types).
> - Non-trivial extensions of existing elements (anything that adds an authoring-visible config, a new mode, or a materially new delivery surface).
> - Cross-cutting platform changes that touch model / session / event contracts across multiple elements (e.g. shared-stimulus container, parameterized items, event consistency work).
> - Authoring-surface changes that shift how authors compose item content.

Does **not** require a PRD: bug fixes, refactors with no behaviour change, demo tweaks, docs / README changes, version bumps, dependency updates.

## Process

1. Read `docs/prds/_template.md` — this is the copy-paste starter.
2. Read `docs/prds/venn-classification/PRD.md` — canonical length and tone. Target that density.
3. Read `UBIQUITOUS_LANGUAGE.md` — use its terms throughout the PRD. Do not invent synonyms.
4. Identify the slug: element name or feature name in kebab-case. It becomes `docs/prds/<slug>/PRD.md`.
5. Check whether a PRD already exists at that path before creating a new one.
6. Draft into `docs/prds/<slug>/PRD.md`. Cover: Context, Goals, Non-goals, Proposed surface (Model, Session, Modes, Controller responsibilities, Authoring surface), Worked example, Accessibility, Open questions.
7. **Present the draft inline in the conversation** and ask the user to confirm the status and content before writing to disk.

## What to Cover

**Model**: list only the key fields with a one-line description each. No TypeScript interfaces — those live in code. 4–6 fields is the right depth.

**Session**: same discipline. At minimum cover the response shape and `completed`.

**Modes**: list which modes the element must handle (`gather`, `view`, `evaluate`, `configure`) and what each does.

**Controller responsibilities**: `validate()` rules (what it rejects and why), `outcome()` scoring policy, `createCorrectResponseSession()` invariant.

**Authoring surface**: what the author sees and can configure. Keep it behavioural, not visual-design-prescriptive.

**Worked example**: one concrete scenario — a real prompt, real tiles/choices, a submitted session as JSON, and the resulting score. This is the most valuable section for constraining implementation.

**Accessibility**: keyboard model, screen-reader annoucements, hit-target sizes, color-independence requirements. Be specific to this element's interaction type.

**Open questions**: only genuinely undecided items. When resolved, delete the bullet and inline the answer into the relevant section.

## Length Discipline

Target: one screen (~60 lines of markdown). Red flags that indicate over-expansion:

- Full TypeScript interface definitions in the PRD body.
- Generic "Performance", "Security", or "Observability" sections with no element-specific content — omit them entirely.
- A dated "Decision log" section — inline rationale next to the Non-goal or field it applies to.
- Owner / date fields — git tracks these; do not add them.
- A "Resolved questions" section — resolved items are deleted and inlined.

## Non-Goals Discipline

Every Non-goal that a reader might push back on must include a one-sentence inline reason. This is the section agents misread most often.

Example pattern:

```
- **No per-tile scoring weights.** All tiles score equally; weights add authoring complexity
  with marginal pedagogical benefit for K-8 formative use.
```

Without the reason, an agent implementing the element may silently add weights because they seem obviously useful.

## Status Rules

- New PRDs start as `Proposal`.
- Transition to `Accepted` only when the implementation contract is agreed (explicitly confirmed by the maintainer in conversation or PR review).
- Never add a `Shipped` status — tests and release tags own that information.
- The optional `## Status log` section records transitions only (`Proposal → Accepted`), not content edits. A fresh Proposal with no transitions does not need this section.

## Facet Splitting Rule

The default is a single `PRD.md` covering all facets. Only split into `delivery.md` / `authoring.md` / `print.md` when a facet has outgrown approximately two screens of element-specific content. Model / Session / event shape always stays in `PRD.md` — never duplicate it into a facet file.

## Tool Usage

- **Read**: `docs/prds/_template.md`, `docs/prds/venn-classification/PRD.md`, `UBIQUITOUS_LANGUAGE.md`, any existing PRD at the target path.
- **Glob**: find existing PRDs (`docs/prds/**/PRD.md`) to check for prior art or a related element's surface.
- **Grep**: scan for terminology conflicts or existing usage of a proposed field name.
- **Write / Edit**: only after the user confirms the draft in conversation.
