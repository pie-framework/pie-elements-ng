# <Element or feature name>

Status: **Proposal** / **Accepted** / **Superseded** · Tier: 1 / 2 / 3 *(optional)* · Impl. path: New / Extend `<element>` / Cross-cutting

*Pick one status. See [`docs/prds/README.md`](../README.md#status) for the vocabulary. If `Superseded`, link the replacement inline: `Status: **Superseded** by [foo-bar](../foo-bar/PRD.md)`.*

## Context

What problem does this solve, for whom? 1-2 paragraphs. Prefer **links to in-repo artifacts** under this PRD directory (for example `![…](./wireframes/<file>.jpg)`) instead of pasting long survey excerpts. If you must summarise external research, keep it to one short paragraph and do not depend on paths outside `pie-elements-ng`.

## Goals

3-5 bullets. Observable from outside the code. Avoid implementation language.

- ...

## Non-goals

Explicit list of things this PRD is **not** doing. For each "no" that a reader might plausibly push back on, put the one-sentence reason inline next to the bullet — that's where rationale for rejected alternatives lives in this repo. The single most useful section for AI-assisted work because it stops the model from helpfully expanding scope.

- ...

## Proposed surface

For an **element**:

- **Model** (key fields, not full TypeScript; one-line rationale inline for non-obvious defaults): ...
- **Session** (key fields): ...
- **Modes supported**: `gather`, `view`, `evaluate`, `configure` *(strike any not supported)*.
- **Key delivery interactions** (pointer / keyboard / touch — high level only): ...
- **Controller responsibilities**: ...
- **Authoring surface** (what the author configures): ...

For a **cross-cutting change**:

- **Contracts touched**: ...
- **Migration story** for existing elements: ...

## Worked example

A single concrete prompt → learner action → submitted state walkthrough. One example is enough.

> *Prompt*: ...

The learner ... The submitted response is ...

## Accessibility

WCAG 2.2 AA is the project baseline (see `docs/ACCESSIBILITY.md`); this section captures element-specific requirements beyond that baseline:

- **Keyboard model**: ...
- **Screen-reader model** (labelling strategy, live-region usage, math announcement if any): ...
- **Hit-target / motion / contrast specifics**: ...

## Open questions

Things that are deliberately undecided. Visible undecided questions beat invisible defaults that the implementation silently picks. Remove a bullet once it's resolved — don't keep a "resolved" log here.

- [ ] ...

## Status log

*Optional. Include only once the PRD has transitioned between status values (e.g. `Proposal → Accepted`). One line per transition, no dates (git has them), and no content-change entries. Delete this section for fresh PRDs that have never transitioned.*

- Raised as proposal from ...
- Accepted after ...
