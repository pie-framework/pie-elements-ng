# Math in accessible names

Status: **Accepted** · Impl. path: Cross-cutting (`multiple-choice`, `ebsr`, `@pie-element/shared-math-rendering-mathjax`) · Tracks Jira [PIE-1244](https://illuminate.atlassian.net/browse/PIE-1244)

## Context

A browser builds a control's accessible name, and a fieldset's name from its `legend`, as plain text, and leaves MathML out. In multiple-choice the prompt was the `fieldset`'s `legend` and each choice is a `label`, so a screen-reader user who tabbed into the question heard the prompt with its formulas missing, under both the MathJax 4 adapter (`esm`) and the legacy MathJax 3 renderer (`iife`). Choices were named with generated English speech of their math, which the adapter puts on each `mjx-container` inside a control ([Control names](../../MATH-RENDERING.md#control-names)): "Pick the answer below, A x equals the fraction with numerator …".

Screen-reader testing compared those spoken names with names that leave the math out. Spoken names made students meet each formula twice, worded differently each time, turned complex expressions into one string with no structure to explore, and reached a braille display as words. Leaving the math out of the name lets the student's screen reader read the hidden MathML in their own voice and settings, explore its structure, and output math braille. Read-aloud generates its speech from the MathML itself, so it needs no speech text in the page. Multiple-choice therefore keeps math out of choice names for every student.

## Goals

- Entering a multiple-choice group never announces a prompt with holes in it.
- A choice's formula reaches the student once, as MathML their screen reader reads, explores and shows as math braille.
- Multiple-choice puts no generated math speech in the page.
- The behaviour is the same under the MathJax 4 adapter and the legacy MathJax 3 renderer, and read-aloud is unchanged.

## Non-goals

- **No switch back to spoken names.** No element reads the accessibility context for this, and spoken names are not offered as an accommodation: read-aloud already speaks math from MathML.
- **No change to the legacy `@pie-lib/math-rendering-module`.** Legacy repos take no further work, and IIFE math rendering is taken as it is unless it breaks legacy elements; everything here runs in this repo, after the hand-off to MathJax 3 where it applies.
- **No fix here for how VoiceOver reads ESM math.** ESM math is announced as a group and read flat where legacy math reads as math; that is investigated on the ESM path separately.
- **No change to other elements' choice structure.** Dropdown options and drag tiles have no place "below" a control for the math to sit, so they keep today's labelled math.
- **No MathJax menu, explorer or tab-order changes here.** They apply to every element and are decided separately.
- **No author-written spoken alternatives.** Authors change nothing.

## Proposed surface

- **Contracts touched**:
  - **Group**: the prompt renders as a block before the `fieldset`, keeping the `prompt` and `legend` classes. The `fieldset` takes a visually hidden native `legend`, "Answer choices" (`answerChoicesA11y` in multiple-choice's catalog). An EBSR part adds its part label, "Part A, answer choices" (`partAnswerChoicesA11y`), so its two groups keep distinct names as their prompts gave them. The Spanish strings await review, and the other locales' are machine-generated, as the rest of those catalogs are.
  - **Choice names**: a choice whose label holds math or a table is named by `aria-labelledby` from its key and a visually hidden note, "A. Pick the answer below" (`pickTheAnswerBelowA11y`). A choice with no key takes its position as a hidden key, "2. Pick the answer below", so the names in a group stay distinct. Other choices are named from their label, and an image choice keeps its key text, "Pick the answer below, A", in the chrome language, before its alt text.
  - **Adapter**: labels math inside a control only when the control's name includes it. A control named by `aria-labelledby` from elements that do not hold the math gets no label, and a label the adapter set before is taken back, so none is left in browse-mode text. The same rule applies after the hand-off to MathJax 3.
  - **Visually hidden text** ("Answer choices", the key and the note) carries the `pie-sr-only` class, which read-aloud skips.
- **Dependency in pie-players**: the assessment toolkit labels math in controls itself with SRE speech (`observeMathControlNames`), for every item that registers with it, whether or not read-aloud is on. Until it follows the adapter's rule, skipping controls named by `aria-labelledby` from elements that do not hold the math, toolkit hosts put speech back on choice formulas, where browse mode reads it and a braille display shows it as words.
- **Migration story**: every student gets the new names on upgrade; EBSR inherits them. Authored CSS that targets the prompt as `legend` needs checking. No model, session or controller changes.

## Worked example

> *Prompt*: "Which of the following is the correct quadratic formula for solving \(ax^2 + bx + c = 0\)?" Choice A: \(x = \frac{-b \pm \sqrt{b^2+4ac}}{2a}\)

| | |
|---|---|
| Group name | "Answer choices" |
| Choice A name | "A. Pick the answer below" |
| Reading mode | the prompt as MathML; "A. Pick the answer below, radio button"; the formula as MathML |
| Braille | "A. Pick the answer below", then the formula as math braille |
| Read-aloud | the prompt, then each choice's formula, from MathML |

A text-only choice such as "25 and 200" is named "A 25 and 200".

## Accessibility

- **Keyboard model**: unchanged. Tab enters the group, arrow keys move between radios, and arrow keys still move focus in checkbox groups.
- **Screen-reader model**: forms mode announces the key and the note, never a partial formula; reading mode reaches each formula once, as explorable MathML. A student who stays in forms mode does not hear the math, and the note tells them where it is.
- **Braille**: the name shows as the key and the note, and the formula reaches the display through the screen reader as math braille.
- **Read-aloud**: unchanged. It voices math from the hidden MathML with SRE, ignores `aria-label`, and skips visually hidden text, so it reads only what is on screen.
- **Voice control (WCAG 2.5.3)**: names start with the visible key, so "click B" works. A choice with no key has no visible text to say, and its hidden position is not shown.

## Open questions

- [ ] Do JAWS and NVDA with MathCAT show a choice's formula as math braille on a refreshable display?
- [ ] Math inside the label (the whole label stays clickable) or after it (no risk of the label text being skipped or read twice)?
- [x] Should an image choice's key text, "Pick the answer below, A", be translated or dropped? Translated, in the chrome language (#549).

## Status log

- Proposal → Accepted after the screen-reader comparison: math kept out of choice names for every student.
