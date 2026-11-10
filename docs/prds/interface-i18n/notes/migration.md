# Interface i18n migration

Rollout for the [interface i18n PRD](../PRD.md). An element migrates together with every library in its delivery graph that still calls `@pie-lib/translator`, because one unmigrated library keeps i18next and both full catalogs in the element's bundle.

## Phases

**Phase 1** (done): `@pie-element/shared-i18n`, the catalog gate in `bun run lint`, the artifact assertion, and `@pie-lib/render-ui`, `@pie-lib/correct-answer-toggle` and `@pie-element/multiple-choice`. Multiple-choice is about 79% of production items, and the two libraries sit on nearly every element's render path. Chrome follows `model.language`, as under the translator, except in the IIFE, which ships English.

**Phase 2** (done): the interface-locale channel and the shared labels.

- pie-players (pie-players #808, #974): `interfaceLocaleContext` in `@pie-players/pie-context`, answered by the item and section players once a host chooses a locale.
- Here: `subscribeInterfaceLocale` in `@pie-element/shared-i18n` and the precedence in multiple-choice; `Collapsible` gained `teacherInstructions` and `rationale` variants that own the four toggle labels (#629).

**Phase 3** (done): every delivery element, each with the libraries it renders through.

| PR   | Packages                                                                                                                                                    |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #629 | `render-ui` (`Collapsible`, adopted by multiple-choice, passage and math-inline), `editable-html-tip-tap`, `math-input`, `math-input-mathlive`              |
| #630 | `mask-markup` (serving ECR, inline-dropdown, drag-in-the-blank and math-templated), `text-select`, `graphing`, `charting`, `graphing-solution-set`          |
| #631 | select-text, match, drawing-response, hotspot, placement-ordering, categorize, graphing, image-cloze-association, charting                                  |
| #632 | extended-text-entry, rubric, explicit-constructed-response, inline-dropdown, math-inline, ebsr, drag-in-the-blank                                           |
| #633 | simple-cloze, mc-populated-blank, venn-classification, video-stimulus, with `delivery-events-svelte` and `media-svelte`                                     |
| #634 | match-list, number-line, math-templated, matrix, likert, multi-trait-rubric, fraction-model, graphing-solution-set                                          |
| #635 | complex-rubric; one alternates-note helper in `@pie-element/shared-i18n`; interface and content language split in `mask-markup` and `editable-html-tip-tap` |

Findings that corrected the plan:

- complex-rubric embeds rubric and multi-trait-rubric and forwards the item's `language` into their models unless they declare their own; it has no catalog of its own.
- charting's limit message is `reachedLimit`, a plural group like image-cloze-association's.
- graphing-solution-set's hardcoded strings live in the element; its line style `'Solid'` is a data value and stays untranslated.
- The `Collapsible` labels moved for React elements. The Svelte elements keep their toggle labels in their own catalogs.
- video-stimulus keeps `uiText` as a model override and no longer defaults `language` to `en`.

**Phase 4** (open, maintainer-run): deprecate `@pie-lib/translator` 5.x. No delivery code here imports it; categorize's authoring view is its last dependent. The `model.language` fallback stays ([Interface locale](../PRD.md#interface-locale)). pie-lib publishes 4.x under the same name and the legacy elements pin it, so the deprecation names the 5.x range.

## Per-package checklist

1. `src/i18n/` with `en-US.ts`, one file per shipped locale, `index.ts` with eager loaders, and `catalog-manifest.json`. The inventory is 14 locales besides the `en-US` source: `es`, reviewed and carried from the translator where it had the key, new keys marked `awaitingReview`; and `th-TH`, `en-GB`, `en-AU`, `fr`, `ar`, `pt`, `ko`, `ja`, `zh`, `cy`, `sv`, `nl-NL` and `ro`, generated against the register and terminology briefs in pie-players `packages/pie-i18n-generated/briefs/`. `ar` and `cy` carry their full CLDR plural sets. Write the snapshot with `bun scripts/write-i18n-english-snapshot.mjs packages/<group>/<pkg>/src/i18n es`.
2. Replace every `translator.t(` with `forLocale(language).t(key)`; `count === 1` branches and explicit `_one`/`_other` keys become plural groups.
3. Move the package's hardcoded learner-facing English into the catalog, translated.
4. The custom element subscribes to the interface locale, holds its render until `isLocaleReady`, and calls `stampElementLanguage` in place of `setLangAttribute`. A Svelte element gets both from `defineDeliveryElement` in `@pie-lib/delivery-events-svelte`.
5. Remove `@pie-lib/translator` from `package.json` once no call remains.
6. Add the element to `migratedElements` in `tests/interface-i18n-artifacts.test.ts`.
7. Tests: a Spanish render, a language change after first render, an undeclared item stamping no `lang`, and a Spanish-declaring item with no player rendering Spanish chrome.
8. A changeset per package touched.
9. Green: `bun run lint`, `bun run verify:dependency-integrity --fail-on-hoist`, `bun run build`, `bun run test`, `bunx tsc --noEmit -p <pkg>`.

The TSX hardcoded-string scanner joins step 3 as an advisory per-package check once written. It can block once the remaining English below is moved.

## Remaining English

Learner-facing strings still outside any catalog:

- the math keypad in each `math-input` library, about 87 strings, and `math-toolbar`;
- `@pie-lib/drag`'s dnd-kit screen-reader announcements;
- the default feedback, `Correct`, `Incorrect`, `Nearly` and `You have not entered a response`, in `@pie-element/shared-feedback` and the ebsr, explicit-constructed-response, multiple-choice, math-inline and number-line defaults: controllers produce it and have no interface locale, so localizing it is a design decision of its own.

`Collapsible` renders its labels without their own `lang` and `dir`.

## Translator coexistence

`@pie-lib/translator` is untouched, and its catalogs keep every namespace for the legacy pie-elements that pin 4.x. Categorize's authoring view is its only remaining dependent here, so no delivery bundle carries i18next.

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
