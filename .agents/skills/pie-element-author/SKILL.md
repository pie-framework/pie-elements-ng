---
name: pie-element-author
description: "Implements a new PIE element (or non-trivial extension) end-to-end: PRD review → Model/Session/Controller → Svelte delivery component → authoring surface → tests. Use when adding a new @pie-element/* package or extending an existing element with a new mode or config surface."
---

# PIE Element Author

End-to-end guide for implementing a new Svelte-first PIE element or making a non-trivial extension to an existing one.

## When to Use

- Adding a net-new `@pie-element/*` package (any QTI 2.2 interaction type not yet implemented).
- Non-trivial extension: adds an authoring-visible config option, a new mode, or a new delivery surface.
- Any work whose scope meets the PRD bar in `AGENTS.md` — specifically: new elements, non-trivial extensions, cross-cutting model/session/event contract changes, or authoring-surface changes.

Do **not** invoke for bug fixes, refactors, demo tweaks, or dependency bumps — a PR description is enough.

## Pre-Implementation Checklist

Before writing a line of code:

- [ ] Does a PRD exist at `docs/prds/<slug>/PRD.md`? If not, draft one from `docs/prds/_template.md` first (use the `pie-prd-author` skill). Do not start implementation against an undocumented surface.
- [ ] Read `PRD.md` fully. Treat the "Proposed surface" as the starting contract. If anything is ambiguous, surface it before coding.
- [ ] Read `CONTEXT.md` and use its canonical language alongside the relevant PRD and established element examples. Do not introduce new synonyms for model/session concepts without surfacing the contract change.
- [ ] Scan `packages/elements-svelte/venn-classification/` as a structural reference. It is the canonical Svelte element in this repo.
- [ ] Confirm the element slug — this becomes the directory name, package name (`@pie-element/<slug>`), and the PRD slug.

## Package Structure

Every Svelte element lives at `packages/elements-svelte/<slug>/` and contains:

```text
src/
  delivery/
    <ElementName>.svelte     # Student-facing delivery component
    index.ts                 # Re-exports component default
  author/
    Author.svelte            # Authoring surface
    index.ts
  controller/
    index.ts                 # Pure TS controller (no DOM, no Svelte)
  index.ts                   # ESM root — re-exports all three sub-entries
  index.iife.ts              # IIFE entry — exports delivery component default; NO customElements.define
  types.ts                   # Model, Session, ViewModel — no `any`

package.json                 # "pie": { "controller": "@pie-element/<slug>/controller" }
                             # "exports" map with ./delivery, ./controller, ./controller.js, ./author subpaths
                             # "files" includes controller.js
controller.js                # Shim: export * from './dist/controller/index.js'
docs.contract.json           # PieDocsContract
vite.config.ts               # ESM delivery build
vite.config.iife.ts          # IIFE delivery build
vite.config.controller.ts    # Controller build
vite.config.author.ts        # Author build
vitest.config.ts
```

## Controller Contract

All five methods are **pure functions** — no DOM access, no side effects, no `any`.

| Method | Signature (sketch) | Contract |
| --- | --- | --- |
| `model(question, session, env)` | `→ ViewModel` | Derives the view-model; never mutates inputs; strips correctness data when `env.mode !== 'evaluate'`. |
| `outcome(question, session, env)` | `→ { score: number, empty: boolean }` | Score in `[0, 1]`; `empty: true` iff session has no response; must be deterministic. |
| `createDefaultModel()` | `→ Model` | Returns a model that passes `validate()` with zero errors, usable as a blank starting point for authoring. |
| `validate(model)` | `→ Record<string, string>` | Returns `{}` for a valid model; returns error messages keyed by field for invalid model; never throws. |
| `createCorrectResponseSession(question)` | `→ Session` | Returns a session whose `outcome()` produces `score === 1.0`. |

`model()` must never return `any`. The `disabled` field on the view model must reflect `env.mode !== 'gather'` or `env.disabled === true`.

## Session and Completion Rule

`session.completed` must flip **atomically** on the last interaction — i.e., in the same state update that records the final response, not in a separate `$effect`. Players gate navigation on this flag; late-setting it causes race conditions.

Pattern:

```typescript
// In the delivery component, on tile placement / choice selection / etc.
function handleInteraction(update: SessionUpdate) {
  const next = applyUpdate(session, update);
  next.completed = isComplete(next, model);  // computed in the same update
  session = next;
  dispatch('session-changed', { session });
}
```

Never derive `completed` lazily in `model()` or a `$derived` — the controller receives the session as-is; what the delivery writes is what the controller scores.

## Svelte 5 Patterns

Use Svelte 5 runes throughout. Key rules:

- State: `let x = $state(initialValue)` — not `let x`.
- Props: `let { model, session, mode } = $props()` — not `export let`.
- Derived: `let foo = $derived(expr)` — not `$: foo = expr`.
- Side effects: `$effect(() => { … })` — not `$: { … }`.
- No `$:` reactive statements — those are Svelte 4 and silently misbehave in Svelte 5 rune-mode files.
- Never add `tag: '...'` inside `<svelte:options customElement={...}>`. Svelte auto-defines that tag at module evaluation, conflicting with player-controlled registration and causing `CustomElementRegistry` duplicate-name errors.

## `session-changed` Event Dispatch

Every session mutation must dispatch a `session-changed` event so the player and host can react. Use the shared helper from `@pie-lib/delivery-events-svelte` (or the equivalent in `packages/lib-svelte/`):

```typescript
import { dispatchSessionChanged } from '@pie-lib/delivery-events-svelte';

function handleInteraction(update) {
  session = { ...session, ...update, completed: isComplete(...) };
  dispatchSessionChanged(hostElement, session);
}
```

If the lib helper is not available, dispatch manually:

```typescript
hostElement.dispatchEvent(
  new CustomEvent('session-changed', {
    detail: { session },
    bubbles: true,
    composed: true,
  })
);
```

Never skip dispatching — the player will not know the session changed.

## Testing Requirements

Tests must cover all 10 dimensions from `AGENTS.md`. At minimum:

**Controller unit tests** (`src/controller/index.test.ts`):

- [ ] `model()` strips correctness data in `gather` mode; exposes it in `evaluate` mode.
- [ ] `outcome()` returns `score === 1.0` for a fully correct session.
- [ ] `outcome()` returns `score === 0.0` for a fully incorrect session.
- [ ] `outcome()` returns correct fractional score for `partialPerTile` (or equivalent) policy.
- [ ] `outcome()` sets `empty: true` when session has no response.
- [ ] `createDefaultModel()` produces a model that passes `validate()` with zero errors.
- [ ] `validate()` returns `{}` for valid model; returns field errors for each known invalid state.
- [ ] `createCorrectResponseSession()` produces a session whose `outcome()` scores `1.0`.

**Delivery component tests** (Testing Library, happy-dom):

- [ ] Renders in `gather` mode without errors.
- [ ] Renders in `view` mode (read-only, no interaction).
- [ ] Renders in `evaluate` mode (shows correctness).
- [ ] Dispatches `session-changed` on interaction.
- [ ] `session.completed` is true after the last required interaction.
- [ ] Passes axe-core with zero violations in each mode.

**E2E / accessibility** (Playwright):

- [ ] Full keyboard navigation reachable (Tab / Space / Enter / Esc as appropriate).
- [ ] axe-core clean.
- [ ] Focus visible at WCAG 2.2 AA spec (2 px ring, 3:1 contrast).

## Quality Gates Before Marking Done

Run these from the repo root; all must pass:

```bash
bun run lint:fix          # Biome auto-fix
bunx tsc --noEmit         # TypeScript type check
bunx svelte-check         # Svelte component validation (from apps/element-demo)
bun test                  # Unit + component tests
```

Before a merge request also run:

```bash
bun run typecheck
bun run check
bun run test:e2e
bun run lint
```
