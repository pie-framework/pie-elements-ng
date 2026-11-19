---
"@pie-element/image-cloze-association": patch
---

The keyboard tab path follows the selection. With no choice selected, it runs through every choice, in the pool or in a response area, and skips the response areas and the pool, which take nothing until a choice is selected. While a choice is selected, it runs through every response area, empty or not, and the pool, and skips the choices; Space or Enter on the pool returns the selection to it, as a click does. The tab path and the reading order also follow `possibilityListPosition`: choices shown above or left of the image come before it, and ones shown below or right come after it (PIE-1462).
