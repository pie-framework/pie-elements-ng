---
"@pie-element/categorize": patch
---

The keyboard tab path follows the selection. With no choice selected, it runs through every choice, in the pool or in a category, and skips the categories and the pool, which take nothing until a choice is selected. While a choice is selected, it runs through the categories and the pool and skips the choices. The tab path and the reading order also follow `choicesPosition`: a pool shown above or left of the categories comes before them, and one shown below or right comes after them (PIE-1452).
