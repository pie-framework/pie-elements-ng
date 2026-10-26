# Arabic letter-variant matching

Status: **Proposal** · Impl. path: Extend `explicit-constructed-response`, `simple-cloze` · Follows Jira [PIE-1358](https://illuminate.atlassian.net/browse/PIE-1358), decision D9 on [PIE internationalization decisions and alternatives](https://illuminate.atlassian.net/wiki/spaces/CE/pages/19983991094/PIE+internationalization+decisions+and+alternatives)

## Context

Explicit-constructed-response and simple-cloze compare a typed answer with the answer key through the shared response normalizer in `@pie-element/shared-controller-utils`. Since PIE-1358 it folds digit systems, Arabic separators, bidi controls, tatweel and presentation forms for every item. It does not fold Arabic spelling variants: hamza and madda alef forms (أ إ آ ٱ) to bare alef, tashkeel, ة to ه and ى to ي. A learner who types مدرسه for the key مدرسة scores wrong. Whether that is a misspelling depends on what the item assesses, so D9 makes the fold an authoring choice per response, off by default. The normalizer already takes `foldLetterVariants`; no element passes it.

This PRD adds that choice to both elements. Sessions, delivery and the learner's stored response are unchanged.

## Goals

- An author can make a response accept answers that differ from the key only in those four variants.
- In explicit-constructed-response the choice is per response area, so one item can assess spelling in one blank and tolerate it in another.
- Items without the setting, every item authored today included, score exactly as they do now.
- The host decides whether authors see the control.

## Non-goals

- **No automatic fold for Arabic content.** The fold changes what counts as correct spelling, so the content language never turns it on; D9 keeps legacy items strict.
- **No choice between the four folds.** D9 specifies them as one option, and four switches would put an orthography decision on every author.
- **No per-alternate setting in explicit-constructed-response.** An area's alternates answer one question; a fold that differed between them would let one alternate accept a spelling its sibling rejects.
- **No change to charting, math-inline or math-templated.** PIE-1358 scopes the option to the two text-entry elements; charting's typed labels can adopt the same field later.
- **No change to the stored response.** The learner's text is stored as typed and folded only inside the comparison.

## Proposed surface

- **Model, simple-cloze**: `foldLetterVariants`, boolean, default `false`. Only `true` turns it on, so a stored `null` stays strict, the case PIE-978 hit for spellcheck.
- **Model, explicit-constructed-response**: `foldLetterVariantsPerChoice`, `boolean[]`, indexed by response area, named after its sibling `maxLengthPerChoice` and following its area through add, delete and reorder in the markup. A missing or non-`true` entry is strict.
- **Configuration**: `foldLetterVariants` (simple-cloze) and `foldLetterVariantsPerChoice` (explicit-constructed-response), each `{ settings, label }`, label "Accept Arabic spelling variants" by default. `settings: false` hides the control and leaves model values in force.
- **Controller**: passes `foldLetterVariants` to `normalizeResponse` on both sides of the comparison: simple-cloze in `getCorrectness`, explicit-constructed-response per area in `getScore` and `getLogTrace`, so `outcome()`, evaluate-mode correctness and the trace log agree. `validate()` and `createCorrectResponseSession()` are unchanged. The field is not passed to the delivery model.
- **Authoring surface**: simple-cloze shows one toggle in the Settings group. Explicit-constructed-response shows a toggle in each response area's section beside "Maximum length (characters)", with help text naming the four variants.

## Worked example

> _Markup_: الطالب في {{0}} اسمها {{1}}.

The author keys area 0 as مدرسة with the setting on, and area 1 as أحمد with it off, so `foldLetterVariantsPerChoice` is `[true, false]`. The learner submits `{ "value": { "0": "مدرسه", "1": "احمد" } }`. Area 0 matches through ة → ه and area 1 does not, because its fold is off: the score is 0.5. With both entries `true` the score is 1; with the field absent it is 0.

## Accessibility

The per-area toggle's accessible name carries the area number, "Accept Arabic spelling variants for response area 1", as the alternate-response inputs already do. Delivery is unchanged.

## Open questions

- [ ] **Control shown by default.** Proposed `settings: false`, so only hosts with Arabic programs show it. `settings: true` would show an Arabic-specific toggle to every author after an upgrade.
- [ ] **Label wording.** "Accept Arabic spelling variants" needs a check by an Arabic content lead, as does whether the help text should list the letters.
