---
"@pie-lib/mask-markup": minor
"@pie-element/drag-in-the-blank": minor
---

Screen reader announcements follow the PIE-1022 drag-in-the-blank spec. After the prompt, a hidden intro gives the number of blanks and answer choices, whether choices can be reused, the keys to use and how many blanks are filled; each blank is read as empty or as holding its answer choice, and the available answer choices are counted after the template. A focused answer choice is named for the choice, and for the blank it sits in, in place of dnd-kit's "draggable". While a choice is selected, each blank and the pool is announced with what ENTER will do there, and a drop, move, removal or cancel is announced with how many blanks are filled and how many answer choices remain. An answer choice with math is read as spoken math ("pi r squared") and an image by its alt text, in its name, in a blank and in every announcement.
