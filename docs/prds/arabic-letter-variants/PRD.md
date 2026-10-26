# Arabic letter-variant matching

Status: **Proposal** · Impl. path: Extend `explicit-constructed-response`, `simple-cloze` · Follows Jira [PIE-1358](https://illuminate.atlassian.net/browse/PIE-1358), decision D9 on [PIE internationalization decisions and alternatives](https://illuminate.atlassian.net/wiki/spaces/CE/pages/19983991094/PIE+internationalization+decisions+and+alternatives)

## Context

Explicit-constructed-response and simple-cloze compare a typed answer with the answer key through the shared response normalizer in `@pie-element/shared-controller-utils`. Since PIE-1358 it folds digit systems, Arabic separators, bidi controls, tatweel and presentation forms for every item. It does not fold Arabic spelling variants: hamza and madda alef forms (أ إ آ ٱ) to bare alef, tashkeel, ة to ه and ى to ي. A learner who types مدرسه for the key مدرسة scores wrong. Whether that is a misspelling depends on what the item assesses, so D9 makes the fold an authoring choice per response, off by default. The normalizer already takes `foldLetterVariants`; no element passes it.

This PRD adds that choice to both elements. Sessions, delivery and the learner's stored response are unchanged.

## Goals

- An author can make a response accept answers that differ from the key only in those four variants.
- In explicit-constructed-response the choice is per response area, so one item can assess spelling in one blank and tolerate it in another.
- Items without the setting, every item authored today included, score exactly as they do now.
- Authors see the control without host changes; a host can still hide it.

## Non-goals

- **No automatic fold for Arabic content.** The fold changes what counts as correct spelling, so the content language never turns it on; D9 keeps legacy items strict.
- **No choice between the four folds.** D9 specifies them as one option, and four switches would put an orthography decision on every author.
- **No per-alternate setting in explicit-constructed-response.** An area's alternates answer one question; a fold that differed between them would let one alternate accept a spelling its sibling rejects.
- **No change to charting, math-inline or math-templated.** PIE-1358 scopes the option to the two text-entry elements; charting's typed labels can adopt the same field later.
- **No change to the stored response.** The learner's text is stored as typed and folded only inside the comparison.

## Proposed surface

- **Model, simple-cloze**: `foldLetterVariants`, boolean, default `false`. Only `true` turns it on, so a stored `null` stays strict, the case PIE-978 hit for spellcheck.
- **Model, explicit-constructed-response**: `foldLetterVariantsEnabled`, boolean, default `false`, the item-level switch, mirroring `maxLengthPerChoiceEnabled`. `foldLetterVariantsPerChoice`, `boolean[]`, indexed by response area, named after its sibling `maxLengthPerChoice` and following its area through add, delete and reorder in the markup. An area folds only when `foldLetterVariantsEnabled` is `true` and its entry is `true`, so switching the item off disables every area without erasing the per-area choices.
- **Configuration**: `foldLetterVariants` in both elements, `{ settings, label }`, with `settings: true` and label "Accept Arabic Spelling Variants" by default, in the Title Case of the neighbouring panel labels. `settings: false` hides the control and leaves model values in force.
- **Controller**: passes `foldLetterVariants` to `normalizeResponse` on both sides of the comparison: simple-cloze in `getCorrectness`, explicit-constructed-response per area in `getScore` and `getLogTrace`, so `outcome()`, evaluate-mode correctness and the trace log agree. `validate()` and `createCorrectResponseSession()` are unchanged. The fields are not passed to the delivery model.
- **Authoring surface**: both elements add the toggle to the settings panel's Settings group, off by default; in simple-cloze it sets `foldLetterVariants`, in explicit-constructed-response `foldLetterVariantsEnabled`. Turning it on in explicit-constructed-response shows an "Accept Arabic spelling variants" toggle in each response area's section beside "Maximum length (characters)", off until the author turns it on, and lists every area in that section, as `maxLengthPerChoiceEnabled` already does. Under each toggle, help text names the four variants: "Accepts أ إ آ ٱ as ا, ignores tashkeel, accepts ه for ة and ي for ى." The help text is fixed; hosts reword the label through configuration.

Authoring wireframes; highlighted rows are new:

- Explicit-constructed-response: ![Explicit-constructed-response authoring wireframe in two states. Top, the default: the settings panel lists Maximum Length Per Choice and Disable Spanish Characters, both on, then a new Accept Arabic Spelling Variants switch, off; the response area for "cow" shows only its maximum length and alternates, with no per-area control. Bottom, with the panel switch on: an Arabic template with two blanks, مدرسة and أحمد; each response area shows an "Accept Arabic spelling variants" toggle below its maximum length, on for مدرسة and off for أحمد, each with help text listing the four variants.](./wireframes/authoring-ecr.jpg)
- Simple-cloze: ![Simple-cloze authoring wireframe: an Arabic prompt and the correct answer مدرسة on the left; the settings panel on the right lists Prompt, then a new Accept Arabic Spelling Variants switch, on, with the same help text listing the four variants, then Teacher Instructions under Properties.](./wireframes/authoring-simple-cloze.jpg)

## Worked example

> *Markup*: الطالب في {{0}} اسمها {{1}}.

The author turns on the panel switch, keys area 0 as مدرسة with its toggle on, and area 1 as أحمد with its toggle off, so `foldLetterVariantsEnabled` is `true` and `foldLetterVariantsPerChoice` is `[true, false]`. The learner submits `{ "value": { "0": "مدرسه", "1": "احمد" } }`. Area 0 matches through ة → ه and area 1 does not, because its fold is off: the score is 0.5. With both entries `true` the score is 1; with the panel switch off or the fields absent it is 0.

## Accessibility

The per-area toggle's accessible name carries the area number, "Accept Arabic spelling variants for response area 1", as the alternate-response inputs already do. Delivery is unchanged.

## Decisions

- **Control shown by default**, `settings: true`. Every author gets one panel row, off by default, beside explicit-constructed-response's existing "Disable Spanish Characters"; the per-area toggles appear only once it is on. Turning it on by mistake has no effect on non-Arabic text, and hiding it would have made the feature depend on a configuration change in each host that authors Arabic.
- **Help text lists the four variants.** Turning the fold on is an assessment-validity call, so the author sees exactly what it forgives.

## Open questions

- [ ] **Label and help-text wording.** "Accept Arabic Spelling Variants" and the help text need a check by an Arabic content lead. Authoring strings are not translated, so Arabic authors read them in English.
