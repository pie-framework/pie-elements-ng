# PRDs (Product Requirements Documents)

Lightweight product/feature specs for `pie-elements-ng`. PRDs live here so engineering and product decisions for new elements (and significant cross-cutting changes) have a stable, reviewable artifact. Code and tests remain the source of truth for *behaviour*; PRDs are the source of truth for *intent*.

## When to write a PRD

Write one for:

- A **new element** (a net-new `@pie-element/*` package or a substantial new interaction type).
- A **non-trivial extension to an existing element** — anything that adds an authoring-visible config, a new mode, or a materially new delivery surface.
- A **cross-cutting platform change** that touches the controller / model / session / event contracts across multiple elements (e.g. shared-stimulus container, parameterized items).
- An **authoring-surface change** that shifts how authors compose item content.

Do **not** write a PRD for:

- Bug fixes.
- Refactors with no observable behaviour change.
- Demo-app or e2e-test tweaks.
- Pure docs / README changes.
- Version bumps and dependency updates.
- Retroactive documentation of stable, already-synced elements you are not actively changing — tests own behaviour; a PRD written after the fact just drifts.

For everything in the second list, a PR description is the right artifact.

### Retroactive PRDs for existing elements

Writing a PRD for a React element that already exists and is not being touched adds documentation overhead without a reader who needs it, and creates a second source of truth that will drift from the code. Don't do it preemptively.

**Do** write a thin PRD for an existing element when you are about to touch it — the PRD is written by someone who just read the code carefully, captures intent that isn't derivable from the code (key non-goals, deliberate divergences from upstream), and is immediately useful. One screen covering model/session shape, non-goals, and known constraints is enough.

## Layout

One subdirectory per PRD, with the PRD itself as `PRD.md` inside that subdirectory:

```text
docs/prds/
├── README.md                 # (this file) — when to write, conventions
├── _template.md              # copy-paste starter for new PRDs
└── venn-classification/
    ├── PRD.md                # the PRD
    ├── wireframes/           # (optional) element-specific wireframes
    ├── examples/             # (optional) worked-example JSON fixtures, model/session snapshots
    └── notes/                # (optional) longer design notes that don't belong in the PRD body
```

Conventions:

- **Directory slug matches the element / feature slug**, so a search by element name finds both the implementation and the spec.
- The PRD body lives in `PRD.md` — explicit about what the file is, and it reads as a natural sibling to facet files (see "Splitting a PRD across facets" below). The small cost is that GitHub / Cursor won't auto-render the directory to the PRD the way they would for `README.md`; that's a trade we accept in exchange for not overloading "README" with two meanings in this tree.
- Supporting files are **optional** — most PRDs stay as a single `PRD.md`. Add `wireframes/` etc. only when there is actually something to put there.
- **Wireframes** belong under this PRD tree — typically `docs/prds/<slug>/wireframes/` — and should be **linked** from `PRD.md` with a repo-relative path (or embedded only when the PRD-specific version intentionally diverges from a shared sketch).
- `_template.md` stays a single top-level file (it is not a PRD, so no subdir).
- No date prefixes on directory names — search is by topic, not by chronology.

### Splitting a PRD across facets

`PRD.md` is the default — one file, all facets. Promote a facet to its own sibling file only when that facet has genuinely overflowed the single file (~two screens of markdown with element-specific content, not padding). Typical sibling names:

- `delivery.md` — student / evaluator UX specifics.
- `authoring.md` — author-tool UX specifics.
- `print.md` — print-mode rendering and export semantics.

When you do split:

- `PRD.md` keeps the **Context**, **Goals**, **Non-goals**, **Model / Session / Modes**, and **Open questions** sections — the cross-cutting contract. Facet files add detail only about their facet and link back to `PRD.md`.
- The model / session shape always lives in `PRD.md`, never duplicated into a facet file. If you find yourself wanting to repeat it, don't — link instead.
- Cross-link: `PRD.md` lists the facet files near the top; each facet file names its parent PRD in its first line.

Do not split just because it feels organised. Splitting costs the reader an extra click and splits the agent's context; the single-file default is usually right.

### Multiple docs per element (non-facet)

A second top-level PRD in the same subdirectory (not a facet of the current one) is warranted when:

- A **v2 feature expansion** diverges enough that merging it into the original PRD would obscure the v1 contract (e.g. `venn-classification/v2-three-circle.md`).
- A **scoring-extension** ships on a different timeline from the core element.
- An **authoring-surface change** materially rewrites the author UI without changing the delivery contract *and* warrants its own scope rather than an `authoring.md` facet of the current PRD.

In those cases, keep `PRD.md` as the canonical current-state PRD and put supplementary PRDs alongside it with descriptive filenames; cross-link them from `PRD.md`. Do not create a second PRD just because the first is getting long — shorten the first instead.

## What PRDs contain (and what they deliberately don't)

PRDs in this repo capture the **functional** shape of a feature: status, context, goals, non-goals, model / session / author surface, a worked example, accessibility, and genuinely-open questions. Everything else is deliberately out.

### Status

Every PRD carries a status on the meta line right under the H1, because the same document circulates at different ratification levels (a Jira comment, a PR, a Confluence embed) and readers need to know *before* reading whether they're looking at a proposal or a ratified contract. The vocabulary is deliberately small:

- **Proposal** — drafted and circulating for review; the surface may change before it's agreed. Agents reading a Proposal must not treat its "Proposed surface" as a fixed contract; they should surface disagreement rather than silently implement against it.
- **Accepted** — agreed contract. Implementation may be complete, in flight, or not started; the PRD describes the end state and is safe to code against. This is the default once review concludes.
- **Superseded** — replaced by another PRD. The status line must link to the replacement, and the PRD otherwise stays as-is for history.

Status is *not* a release tracker — there is no `Shipped` state, because once a PRD is Accepted the tests own behaviour, and a hand-edited "shipped" field just drifts away from the release tags / CHANGELOG that already record that information.

### Status log (optional)

When a PRD transitions between status values, add a one-line entry to a `## Status log` section at the bottom. The log records **state transitions only**, not content churn (git shows content changes already). Entries do not carry dates — git provides the timestamp, and hand-kept dates drift. A fresh Proposal that has never transitioned has no log; omit the section entirely.

Example entries (good):

- `Raised as proposal from PIE-151 discussion.`
- `Accepted after review — consensus on accessibility object as the channel.`
- `Superseded by [foo-bar/PRD.md](../foo-bar/PRD.md).`

Not log entries (keep out):

- Edits to wording, examples, or open questions. Git shows those.
- "Updated wireframe." "Fixed typo." "Added worked example."

### What PRDs still don't track

- Owners, created-date, last-updated fields. Git already tracks this; a hand-edited field on top of git metadata just drifts.
- A formal dated "decision log". The *information* such logs try to preserve — *why didn't we do the obvious alternative?* — is valuable, especially for AI-assisted work where agents will re-raise the same alternatives later. But it lives better **inline**, next to the decision itself, than as a separate ledger:
  - "Why not extend `categorize`?" goes into **Non-goals** as a one-sentence reason on the relevant bullet.
  - "Why is `partialPerTile` the default?" goes into **Proposed surface** next to the field.
  - This keeps the rationale co-located with what it justifies, and it can't drift out of sync the way a separate log can. The status log is the exception only because state transitions are discrete events, not content that can be inlined.

> **The PRD is not the source of truth for behaviour — the tests are.** If a PRD and the test suite disagree, the test wins and the PRD updates in the same PR. This keeps PRDs honest.

## Template

Start from [`_template.md`](./_template.md). Keep it short — one screen of markdown if you can.

## How a PRD relates to other docs

- **Discovery / market survey material** (prioritisation, gap analyses, vendor parity notes) may live outside this repository. Nothing here requires linking to it; a PRD is sufficient on its own for *what* to build in this codebase.
- `.cursorrules`, `.claude/instructions.md`, and package-level READMEs are **standing context** (conventions, patterns, do/don't). PRDs do not migrate this content; reference it where useful but assume it is loaded by the agent already.
- Implementation lives in `packages/elements-svelte/<name>` (or `packages/elements-react/<name>`, etc.); tests live alongside it. The PRD does not replace any of these — it supplements them.

## Working with AI tools (Cursor / Claude Code / Codex)

PRDs are the per-feature context that complements `AGENTS.md` / `.cursorrules` / `.claude/instructions.md`. When starting work on a feature with a PRD, point the agent at the PRD file at the start of the session — it gives the agent the *what* and *why* it would otherwise have to guess at.

A few practical rules to keep PRDs useful with LLMs in the loop:

- **Keep it short.** Aim for one screen of markdown. AI tools fill space if you let them; resist auto-expanding sections that don't add information.
- **Lean on examples and non-goals.** A single worked example plus an explicit "Non-goals" list does more to constrain an agent's behaviour than five paragraphs of acceptance criteria.
- **Inline the "why we didn't do the obvious alternative"** next to the relevant Non-goal or Proposed-surface bullet. This is the information a separate decision log would carry, but inline it can't drift out of sync with the content it justifies.
- **Avoid full type signatures and interface definitions inside PRDs.** Sketch the *shape* of the model and session in 4-6 fields; full TS lives in code, where it can stay accurate.
- **Use the *Open questions* list liberally.** Decisions that aren't made yet should be visible. Don't let the agent pick a default and bury it under plausible-sounding prose. When a question is resolved, *remove* the bullet — don't keep a "resolved" list; the resolution now lives inline in the relevant section.
- **Don't accept LLM-generated padding.** If a PRD draft has long generic sections about "Performance" or "Security" that say nothing element-specific, delete them. A short PRD that contains only true claims beats a long PRD that pads with truisms.

See [`venn-classification/PRD.md`](./venn-classification/PRD.md) for an example PRD that anchors the expected length and tone.
