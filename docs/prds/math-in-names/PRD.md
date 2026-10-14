# Math in accessible names

Status: **Proposal** · Impl. path: Cross-cutting (`multiple-choice`, `ebsr`, `@pie-element/shared-math-rendering-mathjax`) · Tracks Jira [PIE-1244](https://illuminate.atlassian.net/browse/PIE-1244)

> This PRD is circulating for review. The "Proposed surface" below is the current best design, not an agreed contract — surface disagreement rather than silently implement against it.

## Context

A browser builds a control's accessible name, and a fieldset's name from its `legend`, as plain text, and leaves MathML out. In multiple-choice the prompt is the `fieldset`'s `legend` and each choice is a `label`, so a screen-reader user who tabs into the question hears the prompt with its formulas missing, under both the MathJax 4 adapter (`esm`) and the legacy MathJax 3 renderer (`iife`). The adapter now labels each `mjx-container` inside a control with generated English speech ([Control names](../../MATH-RENDERING.md#control-names)), so choices are named "Pick the answer below, A x equals the fraction with numerator …"; the group still drops its math.

Two methods can carry math to assistive technology. **Native reading** keeps math out of names and leaves the hidden MathML to the student's screen reader, which reads it in the student's own voice and settings, lets them explore its structure, and outputs math braille. **Spoken names** put generated speech in the name, so math is heard while arrowing through choices in forms mode, at the cost of a second, unreviewed wording, no structure to explore, and words rather than math braille. This PRD makes native reading the default and spoken names a Player opt-in.

## Goals

- Entering a multiple-choice group never announces a prompt with holes in it.
- By default, every formula in a prompt or choice reaches assistive technology as MathML that the screen reader reads, explores and brailles, and is heard once.
- A Player can opt a student into spoken names without changing items, element versions or authored content.
- Both methods behave the same under the MathJax 4 adapter and the legacy MathJax 3 renderer, and leave read-aloud unchanged.

## Non-goals

- **No change to the legacy `@pie-lib/math-rendering-module`.** Legacy repos take no further work; everything here runs in this repo, after the hand-off to MathJax 3 where it applies.
- **No spoken names by default.** Generated wording differs from the screen reader's own, is English only outside the assessment toolkit, is not reviewed by authors, and replaces math braille with words.
- **No change to other elements' choice structure.** Dropdown options and drag tiles have no place "below" a control for the math to sit, so they keep today's labelled math under both methods until each is reviewed.
- **No MathJax menu, explorer or tab-order changes here.** They apply to every element and are decided separately.
- **No author-written spoken alternatives.** Authors change nothing.
- **No setting read from Player attributes.** Unlike `baseHeadingLevel`, the method is not discovered with `closest('pie-player')`: a setting that changes rendering comes from the accessibility context, which carries the Player's policy precedence and reaches every Player.

## Proposed surface

- **Contracts touched**:
  - **Opt-in**: the support id `spokenMathNames` (name to confirm) in the `Symbol.for("pie.accessibility")` context, requested with `subscribe: true` ([pie-players ADR 0003](https://github.com/pie-framework/pie-players/blob/develop/docs/adr/0003-elements-read-accessibility-settings-from-a-host-neutral-context.md)). The Player answers it; how it decides, through a Player property or PNP policy, is the Player's concern. An unanswered request means native reading. This is the context's first consumer, so the Player's provider ships with it.
  - **Multiple-choice, both methods**: the prompt renders as a block before the `fieldset`, keeping the `prompt` class. The `fieldset` takes a visually hidden native `legend`, "Answer choices" (new key `multipleChoice.answerChoices`, `en` and `es`).
  - **Multiple-choice, native reading**: a choice whose label holds math or a table is named by `aria-labelledby` from its key and a visually hidden note, "A. Pick the answer below" (the note moves into the translator). Other choices keep their label as their name.
  - **Multiple-choice, spoken names**: choices are named from their label content, without the note, so labelled math is in the name ("A. x equals …").
  - **Adapter**: labels math inside a control only under spoken names, and only when the control is named from its content. A control named by `aria-labelledby` gets no labels, so no label is left in browse-mode text. The same rule applies after the hand-off to MathJax 3.
  - **Visually hidden text** ("Answer choices", the note) carries the `pie-sr-only` class, which read-aloud skips.
- **Dependency in pie-players**: the assessment toolkit labels math in controls itself with SRE speech (`observeMathControlNames`), replacing the adapter's labels. It starts for every item that registers with the toolkit, whether or not text-to-speech is enabled or used. It needs to follow the same rule: label only under spoken names, and skip controls named by `aria-labelledby`.
- **Migration story**: EBSR inherits multiple-choice's behaviour. Authored CSS that targets the prompt as `legend` needs checking. No model, session or controller changes.

## Worked example

> *Prompt*: "Which of the following is the correct quadratic formula for solving \(ax^2 + bx + c = 0\)?" Choice A: \(x = \frac{-b \pm \sqrt{b^2+4ac}}{2a}\)

| | Native reading (default) | Spoken names (opt-in) |
|---|---|---|
| Group name | "Answer choices" | "Answer choices" |
| Choice A name | "A. Pick the answer below" | "A. x equals the fraction with numerator negative b plus or minus …" |
| Reading mode | the prompt as MathML; "A. Pick the answer below, radio button"; the formula as MathML | the prompt as MathML; "A. x equals …, radio button" |
| Read-aloud | the prompt, then each choice's formula, from MathML | the same |

A text-only choice such as "25 and 200" is named "A. 25 and 200" under both methods.

## Accessibility

- **Keyboard model**: unchanged. Tab enters the group, arrow keys move between radios, and arrow keys still move focus in checkbox groups.
- **Screen-reader model**: under native reading, forms mode announces the key and the note, never a partial formula, and reading mode reaches each formula once, as explorable MathML. Spoken names trade exploration and math braille for hearing the math in forms mode.
- **Read-aloud**: unchanged under both methods. It voices math from the hidden MathML with SRE, ignores `aria-label`, and skips visually hidden text, so it reads only what is on screen. ADR 0003 requires read-aloud of math to be tested under each method.
- **Voice control (WCAG 2.5.3)**: names start with the visible key, so "click B" works under both methods.

## Open questions

- [ ] The support id's name, and whether the Player derives it from an AfA PNP term or offers it only as a setting.
- [ ] Do pages without a context provider (`iife` players) get an opt-in through the page option, beside `opts.inTabOrder`?
- [ ] Math inside the label (the whole label stays clickable) or after it (no risk of the label text being skipped or read twice)? To settle with screen-reader testing.
- [ ] Choices with `choicePrefix: "none"` would all be named "Pick the answer below": add a visually hidden key, or a number?
- [ ] Under spoken names, should the group be named from the prompt, with its math labelled?
- [ ] Which content beyond math and tables needs the note? Images do not: their alt text is in the name.
