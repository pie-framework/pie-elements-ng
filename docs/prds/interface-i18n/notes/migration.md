# Interface i18n migration

Rollout for the [interface i18n PRD](../PRD.md). An element migrates together with every library in its delivery graph that still calls `@pie-lib/translator`, because one unmigrated library keeps i18next and both full catalogs in the element's bundle.

## Phases

**Phase 1** (done): `@pie-element/shared-i18n`, the catalog gate in `bun run lint`, the artifact assertion, and `@pie-lib/render-ui`, `@pie-lib/correct-answer-toggle` and `@pie-element/multiple-choice`. Multiple-choice is about 79% of production items, and the two libraries sit on nearly every element's render path. Chrome follows `model.language`, as under the translator, except in the IIFE, which ships English.

**Phase 2**: the interface-locale channel and the shared labels.
- pie-players (done, pie-players #808): `interfaceLocaleContext` in `@pie-players/pie-context`, answered by the item and section players from `locale`, released in `@pie-players/pie-context` 1.0.0-beta.6; the subscriber imports it.
- Here (done): `subscribeInterfaceLocale` in `@pie-element/shared-i18n`, the transitional precedence (published, else `model.language`, else `en-US`) in multiple-choice — which now passes the resolved locale into the React tree, so the region label, SR heading, selection counts and the toggle all follow it — and `lang`/`dir` on the toggle's root from its `language` prop.
- Still open in Phase 2: `Collapsible` gains teacher-instructions and rationale variants. Multiple-choice keeps those labels in its own catalog until then; the next element would otherwise copy them.

**Phase 3**: elements in usage order. Shares are of production items; the delivery hour sampled ranks the head the same way, with passage second.

| Order | Element (share)                                                                                                                                                                                                                                                    | Libraries it brings                                            | Package-specific work                                                                                                                                                                                                                                      |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | extended-text-entry (9.4%)                                                                                                                                                                                                                                         | `editable-html-tip-tap`                                        |                                                                                                                                                                                                                                                            |
| 2     | rubric (8.9%)                                                                                                                                                                                                                                                      |                                                                | complex-rubric (2.3%) has no calls of its own and loses i18next once render-ui has                                                                                                                                                                         |
| 3     | passage                                                                                                                                                                                                                                                            |                                                                | hardcoded `'Passage'` region name and tab label                                                                                                                                                                                                            |
| 4     | explicit-constructed-response (3.7%)                                                                                                                                                                                                                               | `mask-markup`                                                  | stored-default note normalization                                                                                                                                                                                                                          |
| 5     | inline-dropdown (1.9%)                                                                                                                                                                                                                                             |                                                                |                                                                                                                                                                                                                                                            |
| 6     | math-inline (1.8%)                                                                                                                                                                                                                                                 | `math-input`                                                   | stored-default note normalization                                                                                                                                                                                                                          |
| 7     | ebsr (1.1%)                                                                                                                                                                                                                                                        | multiple-choice, done                                          | drop the `partA.language` fallback                                                                                                                                                                                                                         |
| 8     | drag-in-the-blank (1.0%)                                                                                                                                                                                                                                           |                                                                |                                                                                                                                                                                                                                                            |
| 9     | the rest, by share: select-text, match, drawing-response, hotspot, placement-ordering, categorize, graphing, image-cloze-association, charting, match-list, number-line, math-templated, matrix, likert, multi-trait-rubric, fraction-model, graphing-solution-set | `text-select`, `graphing`, `charting`, `graphing-solution-set` | note swap removal (placement-ordering, categorize); plural groups for `count === 1` (number-line) and `reachedLimit_other` (image-cloze-association); hardcoded strings (match, placement-ordering, match-list, multi-trait-rubric, graphing-solution-set) |
| 10    | simple-cloze, mc-populated-blank, venn-classification                                                                                                                                                                                                              |                                                                | `src/i18n.ts` shim becomes a `$derived` view; drop mc-populated-blank's `locale` fallback                                                                                                                                                                  |
| 11    | video-stimulus                                                                                                                                                                                                                                                     |                                                                | its own `en`/`es` tables become catalogs; `uiText` becomes `registerMessages` or stays a model override                                                                                                                                                    |

**Phase 4**: deprecate `@pie-lib/translator` 5.x once nothing here depends on it, and drop the `model.language` fallback (PRD open question). pie-lib publishes 4.x under the same name and the legacy elements pin it, so the deprecation names the 5.x range.

## Per-package checklist

1. `src/i18n/` with `en-US.ts`, `es.ts` carried from the translator's namespace, `index.ts` with eager loaders, and `catalog-manifest.json` marking `es` reviewed. Write the snapshot with `bun scripts/write-i18n-english-snapshot.mjs packages/<group>/<pkg>/src/i18n es`.
2. Replace every `translator.t(` with `forLocale(language).t(key)`; `count === 1` branches and explicit `_one`/`_other` keys become plural groups.
3. Move the package's hardcoded learner-facing English into the catalog, translated.
4. The custom element preloads in `_rerender` and calls `stampElementLanguage` in place of `setLangAttribute`.
5. Remove `@pie-lib/translator` from `package.json` once no call remains.
6. Add the element to `migratedElements` in `tests/interface-i18n-artifacts.test.ts`.
7. Tests: a Spanish render, a language change after first render, and an undeclared item stamping no `lang`.
8. A changeset per package touched.
9. Green: `bun run lint`, `bun run verify:dependency-integrity --fail-on-hoist`, `bun run build`, `bun run test`, `bunx tsc --noEmit -p <pkg>`.

The TSX hardcoded-string scanner joins step 3 as an advisory per-package check once written. It blocks only after Phase 3, when every package is clean.

## Translator coexistence

`@pie-lib/translator` stays untouched until Phase 4, and its catalogs keep every namespace, so an unmigrated element renders as it does today. Both engines coexist on one page: each unmigrated bundle carries its own i18next singleton, and every engine copy shares the page registry. A migrated library under an unmigrated element receives the same `language` prop it did before, loads the locale itself, and renders one English frame first. A string a package moves to its own catalog is not removed from the translator, whose other dependents may still render it.

Every IIFE build ships English for the libraries too, so a Spanish item in an unmigrated element's IIFE renders the migrated libraries' chrome in English and the element's own translator strings in Spanish. No current content reaches that case ([IIFE](../PRD.md#iife)).

## Bytes

Per element bundle, IIFE or browser ESM, minified:

| Piece                                                                           | Bytes   | Gzipped |
| ------------------------------------------------------------------------------- | ------- | ------- |
| `@pie-lib/translator` today: i18next with every `en` and `es` namespace         | 64,304  | 20,106  |
| of which i18next                                                                | 43,577  | 13,928  |
| `@pie-element/shared-i18n`                                                      | 6,210   | 2,410   |
| a package's `es` chunk, browser ESM only, multiple-choice and its two libraries | 210–751 |         |

An English-only page with _n_ elements loads _n_ × 64 KB of translator today, and _n_ × 6 KB of engine plus each package's English once every element on it has migrated. The shared browser runtime would cut the engine to one copy per page.

Measured on multiple-choice against `develop`:

| Bundle                   | Before                 | After                  | Change                 |
| ------------------------ | ---------------------- | ---------------------- | ---------------------- |
| IIFE                     | 591,110 B (214,821 gz) | 533,449 B (197,594 gz) | −57.7 KB (−17.2 KB gz) |
| Browser ESM shared chunk | 498,202 B (155,101 gz) | 428,949 B (136,009 gz) | −69.3 KB (−19.1 KB gz) |

Author bundles keep i18next; authoring is out of scope.
