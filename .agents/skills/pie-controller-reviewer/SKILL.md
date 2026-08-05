---
name: pie-controller-reviewer
description: Reviews a PIE controller implementation for correctness, scoring accuracy, and contract compliance. Use when implementing or reviewing controller.ts files — especially outcome(), model(), and createCorrectResponseSession().
allowed-tools: Read, Glob, Grep, Bash
---

# PIE Controller Reviewer

Reviews `controller/index.ts` implementations for correctness, scoring accuracy, and contract compliance.

## When to Use

- Finishing a new controller and want a pre-commit sanity check.
- Reviewing a PR that touches scoring logic, `outcome()`, `model()`, or `createCorrectResponseSession()`.
- Auditing an upstream-synced element's controller for contract compliance with this repo (no `any`, score in `[0, 1]`, etc.).

## The 5-Method Contract

### `model(question, session, env) → ViewModel`

**Must**:
- Return a fully-typed ViewModel (no `any`, no `unknown` widening).
- Set `disabled: true` when `env.mode !== 'gather'` or `env.disabled === true`.
- Strip correctness data (correct answers, correct regions, solution keys) when `env.mode !== 'evaluate'`.

**Must not**:
- Mutate `question` or `session`.
- Return raw model fields unfiltered — always project into a ViewModel type.
- Return `any`. If the shape isn't known statically, fix the types.

### `outcome(question, session, env) → { score: number, empty: boolean }`

**Must**:
- Return `score` in `[0, 1]` (inclusive). Never `> 1`, never `< 0`, never `NaN`.
- Return `empty: true` if and only if the session contains no student response (all placements `null`, no selection, empty text, etc.).
- Be deterministic: identical inputs must produce identical outputs. No `Math.random()`, no `Date.now()`, no global state reads.

**Must not**:
- Return a score as a string (e.g. `"0.75"`). The type is `number`.
- Treat `session.completed === false` as equivalent to empty — a partial response is not empty.

### `createDefaultModel() → Model`

**Must**:
- Return a model that passes `validate()` with zero errors — i.e. `Object.keys(validate(createDefaultModel())).length === 0`.
- Be usable as a blank starting point in the authoring UI without any required author edits before save.

**Must not**:
- Return a model missing required fields that `validate()` would flag.

### `validate(model) → Record<string, string>`

**Must**:
- Return `{}` (empty object) for any valid model.
- Return field-keyed error messages (e.g. `{ "circles": "At least 2 circles are required" }`) for each invalid condition.

**Must not**:
- Throw. All error conditions must be returned as messages.
- Mutate the model.

### `createCorrectResponseSession(question) → Session`

**Must**:
- Return a session such that `outcome(question, session, { mode: 'evaluate' }).score === 1.0`.
- Populate every required session field (`completed`, `placements` or equivalent) correctly.

**Must not**:
- Return a session that would fail `outcome()` type checks.

## Scoring Correctness Checklist

- [ ] Does `allOrNothing` return exactly `1` for all-correct and exactly `0` for any wrong — no fractional values?
- [ ] Does `partialPerTile` (or equivalent) divide by the **total number of tiles/items** — not by the count of correct ones?
- [ ] Is the score clamped to `[0, 1]`? (`Math.min(1, Math.max(0, raw))`)
- [ ] Does `empty` flip correctly? A session with one tile placed and the rest `null` is **not** empty.
- [ ] Are region arrays compared element-wise after sorting? (Two `number[]` representations of the same region must be equal regardless of insertion order.)
- [ ] Is scoring pure? No shared mutable state, no side effects.

**Boundary cases to test**:
- 0 tiles correct out of N → score `0`.
- All N tiles correct → score `1`.
- Exactly N−1 tiles correct (`partialPerTile`) → score `(N-1)/N`.
- Empty session → `{ score: 0, empty: true }`.
- Session with every tile placed incorrectly → `{ score: 0, empty: false }`.

## TypeScript Strictness

- No `any` — enforced by Biome. If you see `as any` or `: any`, flag it `[CRITICAL]`.
- Score field must be typed `number`, not `string | number` or `unknown`.
- Model and session types must be imported from the element's own `src/types.ts`, not duplicated inline.
- Narrowing with `typeof` or type guards is preferred over casts.

## Common Bugs

**Off-by-one in partial scoring**

```typescript
// Bug: divides by correctCount instead of total
const score = correctCount / correctCount; // always 1 when anything matches

// Fix
const score = correctCount / totalTiles;
```

**`completed` not set atomically**

```typescript
// Bug: delivery sets completed in a separate effect; controller receives incomplete session
$effect(() => { session.completed = allPlaced(session); });

// Fix: set completed in the same update as the last placement (see pie-element-author skill)
```

**`model()` leaking correctness data in `gather` mode**

```typescript
// Bug: correct region visible to the student
return { ...model, tiles: model.tiles }; // tiles carry correctRegion!

// Fix: project into ViewModel, strip fields by mode
const tiles = model.tiles.map(({ id, label, imageUrl, imageAlt, correctRegion }) => ({
  id, label, imageUrl, imageAlt,
  ...(env.mode === 'evaluate' ? { correctRegion } : {}),
}));
```

**`validate()` mutating the model**

```typescript
// Bug
model.circles = model.circles ?? []; // mutates the input

// Fix: read only, never write
if (!model.circles || model.circles.length < 2) {
  errors.circles = 'At least 2 circles are required';
}
```

## Review Output Format

Report each finding on its own block:

```
[CRITICAL | WARNING | SUGGESTION] <method> — <one-line description>

Problem:
  <code snippet showing the issue>

Fix:
  <code snippet showing the corrected version>
```

Severity guide:
- **CRITICAL**: Incorrect score, data leak, throws instead of returning errors, type `any`.
- **WARNING**: Wrong `empty` logic, non-determinism risk, `validate()` accepts an invalid model.
- **SUGGESTION**: Style, naming, or minor defensive improvement with no correctness impact.
