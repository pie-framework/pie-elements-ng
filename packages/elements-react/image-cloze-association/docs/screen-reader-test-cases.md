# image-cloze-association: screen reader test cases

Checks the delivery element against the screen reader announcement spec (rows 1–15 and the "simple success path").

## Setup

1. Start the demo: `bun run dev:demo` from the repo root. It serves http://localhost:5222.
2. Use these demos (the `demo` query parameter picks one):

| Demo | URL | Drop areas | Per area | Choices | Reusable |
|---|---|---|---|---|---|
| `number-line` | `/image-cloze-association/deliver?demo=number-line` | 5 (a box for 8 … 12) | 1 | 1 (star) | no |
| `number-line-blanks` | `…?demo=number-line-blanks` | 2 (box for the first / second blank) | 1 | 4 (1, 10, 11, 0) | no |
| `venn` | `…?demo=venn` | 3 (zebras only, both zebras and horses, horses only) | 2 | 4 (grass, wild, pets, stripes) | no |

3. Turn on VoiceOver (Cmd+F5) and its caption panel (VO+F8, Speech tab, "Show caption panel"). Use Safari. Repeat on Windows with NVDA in Firefox or Chrome when you can.
4. Reload the page before each case. Everything is by keyboard: Tab, Enter or Space, Esc.
5. "Hear" means the sentence appears in the caption panel. The tile name and "Press ENTER to select." are also read after most keyboard drops, so a sentence may be followed by them.

## Result columns

- **Page check** is an automated run on 2026-11-26 with a real browser and real key presses. It confirms the page puts the expected text in the focused tile's name or in a live region. It does not prove VoiceOver speaks it.
- **VoiceOver** and **NVDA** are for the tester: Pass, Fail (write what you heard), or N/A.

## Intro (read after the prompt)

| ID | Row | Demo | Steps | Expect | Page check | VoiceOver | NVDA |
|---|---|---|---|---|---|---|---|
| IN-1 | 1 | `number-line` | Read on from the prompt (VO+A) | "The image shows Number line labeled 8, 9, 10, 11, 12. It has 5 drop areas, which can each hold 1 answer choice. There is 1 answer choice, which cannot be reused." | Pass | | |
| IN-2 | 1 | `number-line-blanks` | Same | "The image shows Number line labeled blank, blank, 12, 13. It has 2 drop areas, which can each hold 1 answer choice. There are 4 answer choices, which cannot be reused." | Pass | | |
| IN-3 | 1 | `venn` | Same | "The image shows VENN DIAGRAM labeled Zebras, both, Horses. It has 3 drop areas, which can each hold up to 2 answer choices. There are 4 answer choices, which cannot be reused." ("up to" only because the limit is above 1; "each" only because there are several areas) | Pass | | |
| IN-4 | 2 | any | Continue reading | "Use TAB to move between answer choices and drop areas, ENTER to select/drop, and ESC to cancel." | Pass | | |
| IN-5 | 3 | `number-line` | Continue | "Drop area a box for 8 is empty." … one line per area, up to "a box for 12" | Pass | | |
| IN-6 | 3 | `venn` | Place grass and wild in "both zebras and horses" (see PL-1), reload nothing, then read the intro again | "Drop area both zebras and horses contains the following: answer choice grass answer choice wild End of answer choices in drop area." The empty areas read "is empty." | Pass | | |
| IN-7 | 3 | `number-line-blanks` | Place 11 in the second blank, then read the intro | "Drop area box for the second blank contains answer choice 11." | Not run | | |
| IN-8 | 4 | `number-line` | Continue | "1 available answer choice. star Use TAB to move to answer choice." (no "an", no list) | Pass | | |
| IN-9 | 4 | `number-line-blanks` | Continue | "4 available answer choices. Answer choice: 1 Answer choice: 10 Answer choice: 11 Answer choice: 0 End of available answer choices. Use TAB to move to an answer choice." | Pass | | |

## Single-step announcements

| ID | Row | Demo | Steps | Expect | Page check | VoiceOver | NVDA |
|---|---|---|---|---|---|---|---|
| FC-1 | 5 | `number-line-blanks` | Tab to the choice "1" | "Answer choice: 1" then "Press ENTER to select." No "draggable". | Pass | | |
| SE-1 | 7 | `number-line-blanks` | Enter on "1" | "Selected answer choice 1. Use TAB to move to a drop area." | Pass | | |
| SE-2 | 7 | `number-line-blanks` | Space on "0" | Same wording as SE-1 | Pass | | |
| SE-3 | 7 | item with one drop area | Select a choice | "…Use TAB to move to drop area." (no "a") | Not run (no one-area demo) | | |
| DA-1 | 9 | `number-line-blanks` | Select "1", Tab to the first area | "Selected drop area box for the first blank. Press ENTER to move selected answer choice 1 here or TAB to move to a different drop area." | Pass | | |
| DA-2 | 9 | item with one drop area | Same | Ends "…here or ESC to cancel." | Not run | | |
| PO-1 | 11 | `number-line-blanks` | Select "10", Tab past the areas to the pool | "Press ENTER to leave selected answer choice 10 unplaced or TAB to move to a drop area." | Pass | | |
| PO-2 | 10 | `number-line-blanks` | Place 11, select it, Tab to the pool | "Press ENTER to remove selected answer choice 11 from box for the second blank drop area or TAB to move to a drop area." | Pass | | |
| PO-3 | 10, 11 | item with one drop area | Same | Ends with "ESC to cancel." (row 10) and "move to drop area." (row 11) | Not run | | |
| FC-2 | 6 | `number-line-blanks` | Place 11 in the first blank, Tab to it | "Answer choice: 11 in drop area box for the first blank" then "Press ENTER to select." | Pass | | |

## Results of an action

| ID | Row | Demo | Steps | Expect | Page check | VoiceOver | NVDA |
|---|---|---|---|---|---|---|---|
| PL-1 | 12 | `number-line-blanks` | Select "1", Tab to the first area, Enter | "Placed answer choice 1 in box for the first blank drop area." | Pass | | |
| PL-2 | 12 | `number-line-blanks` | With 1 in the first blank, select 11 and place it there | "Placed answer choice 11 in box for the first blank drop area. To make room for it, answer choice 1 was removed." Choice 1 is back in the pool. | Pass | | |
| PL-3 | 12 | `venn` | Fill "both zebras and horses" with grass and wild, then place pets there | Nothing is placed. A screen reader says "You’ve reached the limit of 2 responses per area. To add another response, one must first be removed." The warning on screen shows the same sentence. | Pass | | |
| PL-4 | 12 | `venn` | Same as PL-3 | No "Placed…" sentence | Pass | | |
| MV-1 | 13 | `number-line-blanks` | Select the placed 11, Tab to the second blank, Enter | "Moved answer choice 11 from box for the first blank drop area to box for the second blank drop area." | Pass | | |
| RM-1 | 14 | `number-line-blanks` | Select the placed 11, Tab to the pool, Enter | "Removed answer choice 11 from box for the second blank drop area." | Pass | | |
| CN-1 | 8 | `number-line-blanks` | Select "0", press Esc | "Answer choice 0 is no longer selected. Use TAB to move to an answer choice." | Pass | | |
| CN-2 | 15 | `number-line-blanks` | Select "10", Tab to the pool, Enter | Same wording as CN-1 for "10" | Pass | | |

## Workflows and rules

| ID | Section | Steps | Expect | VoiceOver | NVDA |
|---|---|---|---|---|---|
| WF-1 | Simple success path (5, 7, 9, 12) | In `number-line`: Tab to the star, Enter, Tab to "a box for 10", Enter | Hear in turn: row 5, row 7, row 9, row 12 | | |
| WF-2 | Change by moving (6, 7, 9, 13) | From WF-1: Tab to the placed star, Enter, Tab to "a box for 12", Enter | Rows 6, 7, 9, 13 | | |
| WF-3 | Change by returning (6, 7, 10, 14) | From WF-2: select the star, Tab to the pool, Enter | Rows 6, 7, 10, 14 | | |
| WF-4 | Cancel (8; 5, 7, 11, 15) | Esc after selecting; then select and leave unplaced in the pool | Rows 8 and 15 | | |
| NR-1 | No progress counts | During every case above | You never hear "1 of 5 drop areas filled" or similar. The element does not announce completion or progress. | | |
| NR-2 | Incomplete answers | Leave areas empty and choices unplaced | Nothing says the answer is incomplete | | |
| NR-3 | No double reading | During every case above | No sentence is spoken twice, and no one sentence cuts off another | | |
| NR-4 | Pointer | Drag with the mouse | The keyboard instructions (rows 9–11) are not spoken for a mouse drag | | |

## Known gaps against the spec

1. **PL-3, the full-area warning:** the warning on screen and the sentence a screen reader says are both the spec's "You’ve reached the limit of [x] responses per area…". The older one-word "Full" is gone. The old `reachedLimit` catalog key is now unused and can be removed from every locale in a follow-up.
2. **Row 1 with no image alt text:** the spec does not say. The element says "The image."
3. **Row 4 with no choices left:** the spec does not say. The element says "0 available answer choices."
4. **Row 13:** "To make room for it…" also follows a move onto an occupied one-answer area. The spec only has it for row 12.
5. **ARIA labels** ("a box for 8", "box for the first blank") are authored in the item and are not changed by the element.
6. The `unnamedChoiceA11y` string ("number N") names a choice with no text or alt. The spec does not cover it.
