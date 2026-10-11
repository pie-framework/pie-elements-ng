# Implementation plan

Tracking for [PIE-1255](https://illuminate.atlassian.net/browse/PIE-1255); removed before the feature branch merges into `develop`. Parent: [Element JSON Schemas](../PRD.md).

Feature branch: `feat/PIE-1255-element-json-schemas`. Each batch is a branch `feat/PIE-1255-schemas-<batch>` in its own worktree, merged into the feature branch by PR. CI runs only on PRs into `develop`, so batch PRs carry local gates.

## Framework (`feat/PIE-1255-schemas-framework`)

- [x] `tools/schemas`: generator, build step, schema test
- [x] `@pie-element/shared-types`: `PieModel` JSDoc, authoring types
- [x] multiple-choice (React reference)
- [x] venn-classification (Svelte reference)
- [x] turbo build input, PRD, legacy changes note
- [ ] PR merged into the feature branch

## Element batches

| Batch | Elements | Status |
| --- | --- | --- |
| A | ebsr, select-text, extended-text-entry, passage, match-list | |
| B | rubric, multi-trait-rubric, complex-rubric, likert | |
| C | drag-in-the-blank, explicit-constructed-response, inline-dropdown | |
| D | math-inline, math-templated, image-cloze-association | |
| E | graphing, graphing-solution-set | |
| F | number-line, charting, fraction-model | |
| G | categorize, match, matrix | |
| H | hotspot, drawing-response, placement-ordering | |
| I | mc-populated-blank, simple-cloze, video-stimulus (Svelte) | |

## Per element

1. `src/types.ts` with `<Name>Model extends PieModel`, `<Name>Session`, and `<Name>Configuration` when `./author` exists, built from `@pie-element/shared-types`. Descriptions come from the legacy `pie-elements/packages/pie-models/src/pie/<element>` interfaces where they still hold; keys come from what the ng code reads and writes.
2. Type the controller, the authoring surface and the defaults files against them: `satisfies`, no `@ts-nocheck` there. Delivery and print may keep `@ts-nocheck`. No behaviour change; record bugs instead of fixing them.
3. `src/index.ts` re-exports `export type * from './types.js'`.
4. `package.json`: `@pie-element/shared-types` dependency, the `./schemas/<kind>.schema.json` exports, `&& bun ../../../tools/schemas/build.ts` at the end of `build`.
5. Every declared kind exercised by a value the element produces; add a demo session where none exists.
6. Legacy differences into `legacy-contract-changes.md`.

## Finishing (feature branch)

- [x] `check-publish-surface`: schema exports required on element packages
- [x] `PIE_ELEMENT_CONTRACT.md` packaging section for schemas
- [x] Changeset (patch) for every element package and `@pie-element/shared-types`
- [ ] Remove this plan; PR into `develop`
