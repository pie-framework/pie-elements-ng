# Math in accessible names

Status: **Proposal** · Impl. path: Cross-cutting (`multiple-choice`, `ebsr`, `@pie-element/shared-math-rendering-mathjax`) · Tracks Jira [PIE-1244](https://illuminate.atlassian.net/browse/PIE-1244)

> This PRD is circulating for review. The "Proposed surface" below is the current best design, not an agreed contract — surface disagreement rather than silently implement against it.

## Context

A browser builds a control's accessible name, and a fieldset's name from its `legend`, as plain text, and leaves MathML out. In multiple-choice the prompt was the `fieldset`'s `legend` and each choice is a `label`, so a screen-reader user who tabbed into the question heard the prompt with its formulas missing, under both the MathJax 4 adapter (`esm`) and the legacy MathJax 3 renderer (`iife`). The adapter labels each `mjx-container` inside a control with generated English speech ([Control names](../../MATH-RENDERING.md#control-names)), so choices are named "Pick the answer below, A x equals the fraction with numerator …".

Two patterns can carry a choice's math to assistive technology. **Spoken names**, the shipped behaviour, put generated speech in the name, so math is heard while arrowing through choices in forms mode, at the cost of a second, unreviewed wording, no structure to explore, and words rather than math braille. **Math kept out of names** names a choice by its key and a note that the answer follows, and leaves the hidden MathML to the student's screen reader, which reads it in the student's own voice and settings, lets them explore its structure, and outputs math braille, at the cost of not hearing the math in forms mode. This PRD keeps spoken names as the default, adds the second pattern behind a Player switch, and lets screen-reader testing of both decide which becomes the default.

## Goals

- Entering a multiple-choice group never announces a prompt with holes in it.
- Choices keep today's names until the comparison is in.
- The two choice-naming patterns can be compared on the same items, under both players, without changing items, element versions or authored content.
- Both patterns behave the same under the MathJax 4 adapter and the legacy MathJax 3 renderer, and leave read-aloud unchanged.

## Non-goals

- **No change to the default choice names before the comparison.** The shipped names stay as they are; the second pattern is a prototype until screen-reader testing shows which serves students better.
- **No change to the legacy `@pie-lib/math-rendering-module`.** Legacy repos take no further work, and IIFE math rendering is taken as it is unless it breaks legacy elements; everything here runs in this repo, after the hand-off to MathJax 3 where it applies.
- **No fix here for how VoiceOver reads ESM math.** ESM math is announced as a group and read flat where legacy math reads as math; that is investigated on the ESM path separately, and the comparison covers both players meanwhile.
- **No change to other elements' choice structure.** Dropdown options and drag tiles have no place "below" a control for the math to sit, so they keep today's labelled math.
- **No MathJax menu, explorer or tab-order changes here.** They apply to every element and are decided separately.
- **No author-written spoken alternatives.** Authors change nothing.
- **No setting read from Player attributes.** Unlike `baseHeadingLevel`, the pattern is not discovered with `closest('pie-player')`: a setting that changes rendering comes from the accessibility context, which carries the Player's policy precedence and reaches every Player.

## Proposed surface

- **Contracts touched**:
  - **Switch**: the support id `mathOutsideNames` in the `Symbol.for("pie.accessibility")` context, requested with `subscribe: true` ([pie-players ADR 0003](https://github.com/pie-framework/pie-players/blob/develop/docs/adr/0003-elements-read-accessibility-settings-from-a-host-neutral-context.md)). The Player answers it; an unanswered request means spoken names. It is a prototype id: ADR 0003 freezes an id once profiles use it, so it stays out of profiles until the comparison decides the default. This is the context's first consumer, so the Player's provider ships with it.
  - **Multiple-choice, both patterns**: the prompt renders as a block before the `fieldset`, keeping the `prompt` and `legend` classes. The `fieldset` takes a visually hidden native `legend`, "Answer choices" (new key `multipleChoice.answerChoices`, `en` and `es`). An EBSR part adds its part label, "Part A, answer choices" (`multipleChoice.partAnswerChoices`), so its two groups keep distinct names as their prompts gave them.
  - **Multiple-choice, spoken names (default)**: choices are named from their label content as shipped, the key's screen-reader text "Pick the answer below, A" for a choice holding math or an image, and the math labelled with its speech.
  - **Multiple-choice, math kept out of names**: a lettered choice whose label holds math or a table is named by `aria-labelledby` from its key and a visually hidden note, "A. Pick the answer below" (`multipleChoice.pickTheAnswerBelow`). Other choices keep their label as their name, and so does a choice with no key, until the open question on `choicePrefix: "none"` is settled.
  - **Adapter**: labels math inside a control only when the control's name includes it. A control named by `aria-labelledby` from elements that do not hold the math gets no label, and a label the adapter set before is taken back, so no label is left in browse-mode text. The rule does not depend on the pattern: the element chooses how to name the control. The same rule applies after the hand-off to MathJax 3.
  - **Visually hidden text** ("Answer choices", the note) carries the `pie-sr-only` class, which read-aloud skips.
  - **Demo app**: `&mathNames=outside` on a deliver page answers the context with `mathOutsideNames`, standing in for a Player, so testers switch patterns on the same item and player.
- **Dependency in pie-players**: the assessment toolkit labels math in controls itself with SRE speech (`observeMathControlNames`), replacing the adapter's labels. It starts for every item that registers with the toolkit, whether or not text-to-speech is enabled or used. It needs to follow the same rule, skipping controls named by `aria-labelledby` from elements that do not hold the math, before math kept out of names can be tested in toolkit hosts. If spoken names become an accommodation instead of the default, the toolkit's PNP policy decides which students get them.
- **Migration story**: EBSR inherits multiple-choice's behaviour. Authored CSS that targets the prompt as `legend` needs checking. No model, session or controller changes.

## Worked example

> *Prompt*: "Which of the following is the correct quadratic formula for solving \(ax^2 + bx + c = 0\)?" Choice A: \(x = \frac{-b \pm \sqrt{b^2+4ac}}{2a}\)

| | Spoken names (default) | Math kept out of names (`mathOutsideNames`) |
|---|---|---|
| Group name | "Answer choices" | "Answer choices" |
| Choice A name | "Pick the answer below, A x equals the fraction with numerator negative b plus or minus …" | "A. Pick the answer below" |
| Reading mode | the prompt as MathML; "Pick the answer below, A x equals …, radio button" | the prompt as MathML; "A. Pick the answer below, radio button"; the formula as MathML |
| Read-aloud | the prompt, then each choice's formula, from MathML | the same |

A text-only choice such as "25 and 200" is named "A 25 and 200" under both patterns.

## Accessibility

- **Keyboard model**: unchanged. Tab enters the group, arrow keys move between radios, and arrow keys still move focus in checkbox groups.
- **Screen-reader model**: spoken names let forms mode announce the math, as English speech with nothing to explore. Math kept out of names announces the key and the note in forms mode, never a partial formula, and reading mode reaches each formula once, as explorable MathML.
- **Read-aloud**: unchanged under both patterns. It voices math from the hidden MathML with SRE, ignores `aria-label`, and skips visually hidden text, so it reads only what is on screen. ADR 0003 requires read-aloud of math to be tested under each pattern.
- **Voice control (WCAG 2.5.3)**: under math kept out of names, names start with the visible key, so "click B" works; whether a spoken name meets 2.5.3 where the visible text is symbols is part of the comparison.

## Open questions

- [ ] Which pattern becomes the default? Decided by screen-reader testing of both, on items with math in the prompt only, in the prompt and the choices, and only in the choices, under both players: VoiceOver on Safari and iPad, JAWS with Chrome and Firefox, NVDA with and without MathCAT, including students who stay in forms mode.
- [ ] Once decided, the support id's permanent name, and whether the Player derives it from an AfA PNP term or offers it only as a setting.
- [ ] Do pages without a context provider (`iife` players) get the switch through the page option, beside `opts.inTabOrder`?
- [ ] Under math kept out of names, math inside the label (the whole label stays clickable) or after it (no risk of the label text being skipped or read twice)?
- [ ] Choices with `choicePrefix: "none"` would all be named "Pick the answer below": add a visually hidden key, or a number?
- [ ] Should the default drop the "Pick the answer below" prefix from a name that already holds the answer, and translate it?
