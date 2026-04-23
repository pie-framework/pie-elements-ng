# Heading accessibility

Status: **Proposal** · Impl. path: Cross-cutting · Tracks Jira [PIE-150](https://illuminate.atlassian.net/browse/PIE-150), [PIE-151](https://illuminate.atlassian.net/browse/PIE-151), [PIE-152](https://illuminate.atlassian.net/browse/PIE-152), [PIE-153](https://illuminate.atlassian.net/browse/PIE-153), [PIE-154](https://illuminate.atlassian.net/browse/PIE-154)

> This PRD is circulating for review. The "Proposed surface" below is the current best design, not an agreed contract — surface disagreement rather than silently implement against it.

## Context

Assessment items render inside different hosts at different positions in the host's page outline — sometimes under an `<h1>` page title, sometimes inside a card with its own `<h2>`, sometimes deep inside a section. The same authored content (a passage with sub-sections, a multiple-choice item, an EBSR with labelled parts) must express its heading structure at whatever level fits the host's outline, so that assistive technology can navigate a coherent document.

Today PIE elements hardcode their heading tags (the TipTap-based rich-text editor emits literal `<h3>` from a single Heading button; the passage element wraps its title in `<h2>`; EBSR and multiple-choice emit screen-reader-only `<h2>` / `<h3>` landmarks). Authors cannot express *relative* heading importance, and hosts cannot align emitted levels to their own outline. The result is mis-ordered heading outlines for screen-reader users and no supported path for hosts to integrate PIE content into their own structural hierarchy.

This PRD defines the end-state contract that lets a host supply the base heading level for its outline, lets authors mark headings inside rich content at relative levels, and lets the framework emit correct semantic tags at render time — without changing output for any host that does not opt in.

## Goals

- Authors mark headings inside rich content at *relative* importance ("heading 1", "heading 2", "heading 3") and never name an absolute `<hX>` level.
- Hosts declare where a player sits in their page outline via a single property, and every element inside that player picks the right `<hX>` tag automatically for both authored content and element-owned framing.
- Hosts that do nothing see byte-identical output on upgrade — no tag changes, no landmarks appearing or disappearing.
- Screen-reader users get a heading outline whose nesting matches the host's own outline, without skipped levels within a single element's output.
- Delivery, print, and the authoring preview all use the same transform, so the author's WYSIWYG view matches every downstream render.

## Non-goals

- **No transformation of literal `<h1>`–`<h6>` tags in content.** Rewriting literals would silently push every existing `<h3>` from today's editor output to a different level under any base that isn't 3, breaking every already-authored item. The transform operates only on `data-heading` markers; literal heading tags pass through untouched.
- **No storage of heading level in the element model.** Base level is host-supplied render context, never serialized, so one authored item renders correctly at any level in any host.
- **No auto-offset when players nest.** A nested player inherits its parent's base level when unset; if the host wants content one level deeper, the host sets the attribute explicitly. Auto-increment creates subtle debugging pain and hides host intent.
- **No ARIA fallback** (`role="heading" aria-level="N"`). Native `<hX>` interoperates better with assistive tech, print/PDF outline tools, and host CSS; host UA-style resets live once in `pie-theme`.
- **No per-field base-level API for hosts.** The host sets one base per player. An element whose internal structure needs its prompt at `base` and its feedback at `base + 1` computes that offset internally and passes the adjusted level to the transform. The host-facing surface stays one-dimensional.
- **No heading-level dropdown wider than three levels in authoring.** Observed K-12 assessment content uses at most three relative levels; the transform itself clamps at `h6`, but the authoring UI exposes `heading1` / `heading2` / `heading3` only, to keep author mental models aligned with observed practice.
- **No persistence of the authoring preview's base-level toggle.** The author preview lets an editor cycle through levels to verify the structure; the setting is a UI affordance, not a model field.

## Proposed surface

### Architecture at a glance

![Architecture flowchart — Host sets base-heading-level and show-framing-heading on the outermost PIE player; the value propagates down the player stack (pie-item-player → pie-section-player → pie-element-player, each inheriting from its ancestor when unset); the hosted element reads `accessibility.baseHeadingLevel` and `accessibility.showFramingHeading` and routes its framing wrapper through a conditional promotion to `<h{base}>` and its rich-HTML fields through the shared transform `transformDataHeadings(html, base)`; the transform rewrites `<p data-heading="headingN">` to `<h{clamp(base+N-1, 1, 6)}>` while preserving the `data-heading` attribute and leaving literal `<hX>` tags untouched; both paths converge into the rendered DOM, whose heading outline aligns with the host's outline.](./diagrams/architecture.jpg)

The same `accessibility` object shape lives on every player; children inherit from the nearest ancestor player when unset. Elements consume the object but never emit `<hX>` tags directly — every semantic heading in output comes either from promoting a framing wrapper or from the shared transform, so enforcement (below) has a single surface to police.

**Player contract.** `pie-item-player`, `pie-section-player`, `pie-element-player` (in both `pie-players` and `pie-elements-ng`) expose an `accessibility` property:

- `accessibility.baseHeadingLevel?: 1 | 2 | 3 | 4 | 5 | 6` — the level of the first heading emitted inside this player. Undefined means the transform does not run and framing headings are not promoted. Precedent: `pie-section-player` already carries `accessibility: Object` ([`PieSectionPlayerBaseElement.svelte:16`](https://github.com/RenaissancePlace/pie-players/blob/main/packages/section-player/src/components/PieSectionPlayerBaseElement.svelte)); this PRD extends that shape and mirrors it onto every player.
- `accessibility.showFramingHeading?: boolean` — whether the element's own framing wrapper (passage title, "Multiple Choice Question" landmark, EBSR "Two-Part Question" and part labels) is promoted to a semantic `<hX>` at `baseHeadingLevel`. Undefined or false keeps the wrapper as today's non-heading node (styled div or screen-reader-only span), so visible layout and existing framing landmarks are preserved.

Two sugar attributes reflect into the object for declarative hosts: `base-heading-level` (integer 1–6; clamped; invalid values treated as absent) and `show-framing-heading` (DOM-boolean; `"false"` string normalised to false for JS-property symmetry). Setting the object property and the attributes are equivalent; attribute is removed → property resets to undefined on next render.

Nesting: a player with `accessibility` unset inherits from its nearest ancestor player at mount and on change; no auto-offset by container type.

**Shared transform.** `transformDataHeadings(html: string, baseLevel?: number): string` — pure function, exported from `@pie-lib/render-ui` (React) and `@pie-elements-ng/lib-svelte/rich-text` (Svelte). Rewrites `<p data-heading="headingN">…</p>` to `<h{clamp(baseLevel + N - 1, 1, 6)} data-heading="headingN">…</h…>`, preserving the `data-heading` attribute so host CSS keyed on `[data-heading]` continues to match. Fast path: when `baseLevel` is undefined or the input contains no `data-heading=` substring, returns the input unchanged (the common case for legacy content, so the transform is effectively free).

**React render path.** `PreviewPrompt` in `@pie-lib/render-ui` invokes the transform. React elements that bypass `PreviewPrompt` with direct `dangerouslySetInnerHTML` (currently around twenty sites, e.g. `categorize/choice.jsx`, `match-list/answer.jsx`, `multiple-choice/choice-input.jsx`, `inline-dropdown`, `image-cloze-association`, `placement-ordering/tile.jsx`) import the pure function and call it on each rich-HTML string they render.

**Svelte render path.** `packages/lib-svelte/rich-text` exposes a `<RichText html baseHeadingLevel />` component plus the same pure function. Svelte elements route rich-HTML fields through `<RichText>` or inline as `{@html transformDataHeadings(field, accessibility?.baseHeadingLevel)}`.

**Authoring.** Authoring changes target the TipTap-based rich-text editor (`editable-html-tip-tap`); the legacy Slate-based `editable-html` is out of scope for this PRD. The TipTap Heading control is a three-level picker producing `<p data-heading="headingN">` (N ∈ {1, 2, 3}); keyboard shortcuts `Cmd/Ctrl+Opt+1/2/3` apply the levels, `Cmd/Ctrl+Opt+0` clears. The editor canvas styles `[data-heading="headingN"]` blocks with visible hierarchy so authors see headings as they type. Paste from Word / Google Docs normalises `<h1>`–`<h6>` into `<p data-heading="headingN">` (clamping `h3`–`h6` to `heading3`). Editor load/save preserves the `data-heading` attribute byte-for-byte. The author preview runs the same transform with a default `baseHeadingLevel` of 2, and exposes a base-level toggle for WYSIWYG verification at arbitrary levels.

**Per-element rules.** Every element that renders rich HTML routes each rich-HTML field through the shared transform. Every element that wraps its output in an element-specific landmark emits that wrapper as a non-heading by default and promotes it to `<h{baseHeadingLevel}>` only when `accessibility.showFramingHeading === true`. The wrapper's visible text and its CSS class hooks (`.pie-passage-title`, `.pie-mc-prompt-label`, `.pie-ebsr-part-label`, etc.) are unaffected by the promotion — the host's visual styling is independent of the semantic tag.

**Enforcement.** Dev builds emit a `console.warn` when an element receives `baseHeadingLevel` but the shared transform was not invoked on a rich-HTML field whose string contains `data-heading=`. A CI check bans literal `<h[1-6]` in element render paths outside an allowlist of transform call sites. A shared coverage test — mount with `baseHeadingLevel=3` and input containing `data-heading="heading1"`, assert the output contains `<h4>` and no `<h1>` or `<h2>` — runs against every element that adopts the transform.

## Worked example

Authored passage content (as stored):

```html
<p data-heading="heading1">Dune Formation</p>
<p>Dunes form when prevailing winds deposit sand…</p>
<p data-heading="heading2">Types of dunes</p>
<p>Barchan dunes are crescent-shaped…</p>
```

Host A, top-level page, sets `base-heading-level="2" show-framing-heading`. Rendered DOM:

```html
<h2 class="pie-passage-title">[authored passage title]</h2>
<h2 data-heading="heading1">Dune Formation</h2>
<p>Dunes form when prevailing winds deposit sand…</p>
<h3 data-heading="heading2">Types of dunes</h3>
<p>Barchan dunes are crescent-shaped…</p>
```

Host B embeds the same item under a section card whose heading is `<h3>`, sets `base-heading-level="4"`, does not set `show-framing-heading`. Same authored source renders as:

```html
<div class="pie-passage-title">[authored passage title]</div>
<h4 data-heading="heading1">Dune Formation</h4>
<p>Dunes form when prevailing winds deposit sand…</p>
<h5 data-heading="heading2">Types of dunes</h5>
<p>Barchan dunes are crescent-shaped…</p>
```

Host C sets nothing on upgrade. Output is byte-identical to today: passage title renders in its current tag, `data-heading` markers stay as styled `<p>` with the attribute intact (host CSS selectors on `[data-heading]` still match), no landmarks change.

## Accessibility

WCAG 2.2 AA baseline applies (see [`docs/ACCESSIBILITY.md`](../../ACCESSIBILITY.md)). The element-specific requirements this PRD codifies:

- **1.3.1 Info and Relationships / 2.4.6 Headings and Labels / 2.4.10 Section Headings**: every heading emitted by a PIE element appears in the document heading outline at a level that slots correctly under the host's own outline when the host opts in.
- **No skipped levels within an element's output.** Inline markers render at exactly `base + (N - 1)` (clamped to `h6`); the transform never inserts or omits levels the author did not express.
- **Host opt-out preserves existing assistive-tech landmarks.** Current framing headings (passage `<h2>` title, EBSR `<h2 class="srOnly">Two-Part Question</h2>`, multiple-choice `<h3 class="srOnly">Multiple Choice Question</h3>`) continue to render for hosts that do not opt in, so screen-reader users of un-upgraded hosts do not lose navigation landmarks on ship day.
- **Rendering parity.** Delivery, print, and the authoring preview all run the same transform, so a screen reader, a PDF outline viewer, and the author's editor preview all agree on the heading structure.

## Open questions

*(none at this time)*
