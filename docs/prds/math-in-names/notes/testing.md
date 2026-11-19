# Testing math in choice names

Notes for screen-reader and braille testing of [the PRD](../PRD.md).

## The version to test

The behaviour is in `@pie-element/multiple-choice` from the first `next` snapshot that `develop`
publishes after this change merges, `npm view @pie-element/multiple-choice dist-tags.next`. Load an
item with that version in pieoneer, or in the demo app (`bun run dev` in `apps/element-demo`).

Test on a page without the assessment toolkit, such as an item preview or the playground. Toolkit
hosts, such as the section player, still label choice formulas with their own speech until the
pie-players change in the PRD lands, so a choice's formula there is read, and shown in braille, as
that label.

## What it should sound like

|                    |                                                                       |
| ------------------ | --------------------------------------------------------------------- |
| Entering the group | "Answer choices, radio group" ("Part A, answer choices" in EBSR)      |
| Moving to choice A | "A. Pick the answer below, radio button"                              |
| Reading mode       | the prompt, then each choice's key and note, then its formula as math |
| Braille            | the key and the note, then the formula as math braille                |

The prompt is read before the group, with its math. Read-aloud reads the prompt and each choice's
formula, and none of the hidden text.

## Matrix

- **Items**: math in the prompt only (E219966); math in the prompt and the choices
  (`c3aa9c93-6658-4c1a-ab99-e4ebd5c1c01e`); math-only choices in MathML (`ITEM-LOGIC--652583`);
  near-identical long expressions; a multiple-select item with math; an item with no choice keys;
  an EBSR with math in both parts.
- **Players**: both renderers, ESM (MathJax 4) and IIFE (the legacy MathJax 3). ESM math is announced
  as a group and read flat in VoiceOver where legacy math reads as math, investigated separately.
- **Screen readers**: VoiceOver with Safari and on iPad, JAWS with Chrome and Firefox, NVDA with
  Chrome with and without MathCAT, each with a refreshable braille display where available.
- **For each**: what is heard entering the group and arrowing through the choices in forms mode;
  what is heard reading the choices in browse mode, and whether anything is heard twice; whether the
  screen reader's math explorer opens on a choice's formula; whether the braille display shows the
  formula as math braille; and how long a student takes to tell near-identical choices apart.
