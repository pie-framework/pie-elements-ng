# Venn diagram classification

Status: **Accepted** · Tier: 3 · Impl. path: New

## Context

Classification into overlapping sets is a recurring K-8 pattern across life-science (classify animals that are *reptiles*, *egg-layers*, or both), social studies (attributes of two historical periods), and ELA (character-trait sets that share a region). Most assessment platforms today simulate it using `categorize`, which models **disjoint** buckets and loses the first-class *overlap* region that Venn diagrams depend on. The workaround is visible evidence of demand: authors consistently reach for overlap semantics even when the tooling doesn't support them.

This PRD specifies a new first-class `venn-classification` element with an explicit overlap region, a tile tray, and the same authoring / delivery / scoring surface as other classification-style PIE elements. **v1 in this repo does not ship a print custom element** (authoring + delivery + controller only); static element docs are generated under `apps/element-demo/static/element-docs/venn-classification/` from `docs.contract.json`.

Wireframes (2-set; 3-set layout is triangular and will be wireframed alongside delivery implementation):

- Delivery (gather mode): ![Venn classification delivery wireframe — two overlapping circles labelled "Reptile" and "Egg-layer", tiles placed in each of the four regions (left-only, overlap, right-only, outside) with a tray of unplaced tiles below.](./wireframes/delivery.jpg)
- Authoring interface: ![Venn classification authoring wireframe — two-panel layout. Left panel: prompt editor with rich-text toolbar, per-circle label inputs, a tile list with per-row region radios, scoring-policy radios, and a collapsed advanced region-labels disclosure. Right panel: live preview of the 2-set Venn diagram with authored tiles placed in their correct regions.](./wireframes/authoring.jpg) *(Wireframe may still show a 2/3 circle toggle; v1 author is 2-set only, with a resizable editor/preview split.)*

## Goals

- Authors can author a **2-set** Venn item (four regions including outside) by providing a label per circle, a list of tiles, and the correct region per tile. **Three-set authoring and delivery are deferred** (model types remain N-generic for a later layout pass).
- Test-takers can place each tile into exactly one named region of the diagram (**four regions** for the shipped v1) via pointer, touch, or keyboard-only.
- Submitted response has a predictable shape that downstream scoring can read as a per-tile region map, and delivery renders per-tile correctness and a correct-answer reveal in `evaluate` mode.
- Model is N-generic so future delivery work (4+ circles, Euler-style diagrams) doesn't require a breaking data-shape change.
- Element passes WCAG 2.2 AA; every region has a text label beyond its visual position, and placement changes are announced.

## Non-goals

- **Not an extension of `categorize`.** `categorize` assumes disjoint buckets; adding a first-class overlap region would force it to carry a conditional `allowOverlap` mode and a richer `correctRegion` shape even for items that only need one bucket — a penalty paid by every existing `categorize` use. A new sibling element keeps both contracts clean.
- **4+ circles are not rendered in v1.** The data model is N-generic so a future layout can ship without a model migration, but **v1 delivery lays out exactly two circles** and `validate()` rejects any other count. **Three-set (8 regions) is not implemented in v1** (deferred with 2-set-only author UI). Moving 4+ layout (region placement, overlap-of-overlaps labelling, tile-size trade-offs) to a later release keeps v1 tight.
- **No author-supplied region shapes** other than circles. No ellipses, no custom SVG masks.
- **A tile cannot belong to multiple regions simultaneously.** Each tile is placed in exactly one region; the overlap regions are their own regions, not multi-assignment.
- **No per-tile scoring weights.** All tiles score equally within an item; scoring policy (all-or-nothing vs. partial credit) is configured once per item.
- **No partial credit for near-miss regions** (e.g. placing a tile in the overlap when the correct region was "left only"). Partial credit operates at per-tile granularity only; within a tile, a wrong region is fully wrong. Region-adjacency heuristics add pedagogical ambiguity (which regions count as "near"?) for little gain.
- **No pre-placed tiles** (tiles that start inside the diagram before the learner begins). Authoring complexity and the a11y cost of "some tiles were already here when you arrived" are not justified in v1.
- **No in-gather hints or progressive reveals per region.** Progressive-hint behaviour is cross-cutting and lives in candidate #20.
- **No rich typography in tile labels** for v1 beyond **plain text plus inline math** (MathJax in delivery). **Optional per-tile images** are supported in v1 as `imageUrl` + `imageAlt` (required when an image URL is set) for accessibility; delivery renders an `<img>` with the tile button’s accessible name preferring `imageAlt`. Arbitrary rich HTML in labels, icon fonts mixed with text, and author-driven inline layout in labels remain out of scope.
- **No diagram background image or fill.** Diagrams render on the host's background.
- **No author-editable hex colors.** Circle fills, strokes, and correctness indicators use theme CSS variables (`--pie-primary-*`, `--pie-secondary-*`, `--pie-correct`, `--pie-incorrect`, etc. — see [`docs/THEMING.md`](../../THEMING.md)). Authors don't pick raw colors; changing themes is a host concern.

## Proposed surface

**Model** (key fields; full TS lives in code):

- `prompt` — markup (TipTap output).
- `circles` — ordered array `[{ label: string }, …]`, **`length === 2` in v1** (validated). The data shape stays N-generic so a v2 3-set layout can ship without a data migration. Indexes are 0-based and stable (the authored order drives which circle is circle 0).
- `regionLabels` — optional `Record<string, string>` keyed by region-key. A region-key is the sorted comma-joined list of circle indexes that define the region: `""` is the outside / "Neither" region, `"0"` is circle 0 only, `"0,1"` is the overlap of circles 0 and 1, `"0,1,2"` is the triple overlap. When a key is missing, delivery auto-composes the label from the circle labels (e.g. `"Reptile only"`, `"Reptile and Egg-layer"`, `"Neither Reptile nor Egg-layer"`). Most authors won't set any entry; overrides are for non-default phrasing like `"Both"` or a translated equivalent.
- `tiles` — `[{ id, label, correctRegion: number[] }, …]` plus optional **`imageUrl`** / **`imageAlt`**. `label` accepts **plain text with inline math** (rendered by MathJax in v1 delivery; **authoring uses plain text fields**, not a TipTap math surface on tiles). `correctRegion` is a sorted list of circle indexes naming the region the tile belongs in; `[]` means the outside region. For **two** circles the valid values are `[]`, `[0]`, `[1]`, `[0, 1]` (4 regions).
- `scoringPolicy` — `'allOrNothing' | 'partialPerTile'`, default `partialPerTile`. Classification-style items (sort-into-buckets, match, Venn) commonly carry partial-credit-per-placement in K-8 formative assessment — QTI `mapResponse` exists for this pattern — because a single mis-sort shouldn't wipe out a mostly-correct multi-tile response. Items used in high-stakes summative contexts can flip to `allOrNothing`. For a small 2-tile Venn the two policies are equivalent; the distinction starts to matter at 4+ tiles.

**Session** (key fields):

- `placements` — `{ [tileId]: number[] | null }`. `null` means the tile is still in the tray; the key is always present per tile so consumers don't need to diff against `model.tiles` to tell "unplaced" from "never asked". `[]` is the outside region, `[0]` is circle 0 only, `[0, 1]` is the overlap of 0 and 1, etc. Arrays are always sorted.
- `completed` — boolean — true once every tile is placed (no `null` values remain). Host players (e.g. the assessment players Renaissance Star uses) gate learner navigation on this, so it must flip deterministically and atomically on the last placement.

**Modes**: `gather`, `view`, `evaluate`, `configure`. In `evaluate`, delivery is responsible for showing the learner's placements *and* the authored correct regions (per-tile correctness markers plus a "correct answer" reveal affordance); correct-answer rendering is owned by the element, not the player, consistent with other PIE elements.

**Theming**:

The PRD targets **`pie-venn-circle` / `pie-venn-circle-{n}` hooks** and host-theme CSS variables per [`docs/THEMING.md`](../../THEMING.md) (`--pie-primary-*`, `--pie-secondary-*`, `--pie-correct`, `--pie-incorrect`, etc.). **v1 delivery in this repo still uses fixed palette values in component CSS** (not yet wired to `--pie-*` tokens end-to-end); treating token wiring as a follow-up keeps the first delivery milestone shippable without blocking on theme package integration.

**Key delivery interactions**:

- **Pointer / touch**: drag a tile from the tray (or any region) into a region, or back into the tray. Drop zones highlight on dragover. Tiles snap to a light grid within their region so placements look neat without the learner having to pixel-aim, especially when multiple tiles share a region.
- **Keyboard (two-step)**: `Tab` moves focus through tiles and regions; on a focused tile, `Space` / `Enter` "picks up" the tile (enters placement mode), `Tab` / arrow keys move focus between the tray and each named region, `Space` / `Enter` drops into the focused region, `Esc` cancels the pickup.
- **Atomic drops**: a tile that leaves region A and lands in region B updates `placements[id]` once. No intermediate "held" session state.

**Controller responsibilities**:

- Standard PIE controller surface (`model`, `outcome`, `createDefaultModel`, `validate`, `createCorrectResponseSession`).
- `validate` in v1 requires **`circles.length === 2`** and requires each `tile.correctRegion` to be a sorted subset of `[0, circles.length)`; rejects otherwise with a message pointing at the offending tile. Tiles must have a non-empty text label **or** an image URL with non-empty alt text.
- `outcome` scores based on `scoringPolicy` and returns a fractional score in `[0, 1]` (the PIE outcome convention; a gradebook sees a single number and the UI derives "3 of 4"-style display): `partialPerTile` returns `correctTiles / totalTiles`; `allOrNothing` returns `1` iff every tile matches the authored `correctRegion`, else `0`. Two region arrays are equal iff element-wise equal (they are kept sorted by convention).
- `createCorrectResponseSession` returns placements matching each tile's `correctRegion`.

**Authoring surface**:

- Prompt editor (shared rich-text component).
- **Two circles** (fixed in v1 UI): label input per circle (no 3-set toggle in the shipped author).
- Tile list editor: add / edit / remove / reorder tiles; optional image URL + alt; per-tile correct-region picker — a compact grid whose cells match the **four** 2-set regions, each labelled with the auto-composed region name.
- Scoring policy selector.
- Optional region-label overrides: any composed region name can be overridden inline; the computed default is shown next to each input while unset so authors aren't surprised by what delivery will render.
- **Live preview panel** embedding read-only delivery (`view` mode, `disabled`) with a session that places each tile in its **authored correct region** (`buildPreviewSession`), updating as edits happen. The editor / preview areas use a **resizable split** (default ~50/50). Full theme parity in the iframe preview is not guaranteed until delivery CSS consumes `--pie-*` tokens consistently.

## Worked example

> *Prompt*: Sort each animal into the Venn diagram. Place it where **Reptile** and **Egg-layer** are both true, only one is true, or neither is true.

Tiles: `Crocodile`, `Frog`, `Dolphin`, `Turtle`.

The item is authored with `circles = [{ label: "Reptile" }, { label: "Egg-layer" }]`. The learner drops `Crocodile` in the overlap region, `Frog` in "Egg-layer only" (circle 1), `Dolphin` in the outside region, and `Turtle` in the overlap. The submitted `session.placements` is:

```json
{ "crocodile": [0, 1], "frog": [1], "dolphin": [], "turtle": [0, 1] }
```

`session.completed` is `true`. With `scoringPolicy = partialPerTile` and author-marked `correctRegion` values (`crocodile: [0, 1]`, `frog: [1]`, `dolphin: []`, `turtle: [0, 1]`), the outcome is `1.0` (4 of 4 correct).

## Accessibility

- **Keyboard model**: full interaction reachable with `Tab` / `Space` / `Enter` / arrow keys / `Esc`. No pointer-only paths. Picking up a tile announces `"picked up Crocodile, drop target: Reptile only"` and subsequent region focus announces each drop zone by its composed label.
- **Region labels are semantic, not positional.** Accessible names are auto-composed from the circle labels: single-circle region N → `"<circles[N].label> only"`; any multi-circle overlap → the participating labels joined with `" and "` (e.g. `"Reptile and Egg-layer"`, `"A and B and C"`); outside region → `"Neither Reptile nor Egg-layer"` for 2-set, `"None of <a>, <b>, <c>"` for 3-set. An entry in `model.regionLabels` (keyed by the sorted region-key, e.g. `"0,1"` for the overlap or `""` for outside) overrides the auto-composed name verbatim.
- **Screen reader**: polite `aria-live` region announces each placement (`"Crocodile placed in Reptile and Egg-layer"`) and each pickup / cancel. **Announceable names** use stripped plain text from `label` or **`imageAlt` when an image is present** (not full MathJax Speech Rule Engine output on the live string path).
- **Hit targets**: tiles meet 44×44 px minimum; drop zones at least 120×120 px so a drop is unambiguous for users with motor constraints.
- **Focus visibility**: 2 px ring on the focused tile or region; the "held" tile during keyboard pickup gets a distinct visual treatment (border + lifted shadow) in addition to the live-region announcement.
- **Reduced motion**: no drag animations; instant state changes only.
- **Color independence**: region correctness in `evaluate` mode is conveyed by icon + text, not color alone.

## Open questions

*(none at this time)*
