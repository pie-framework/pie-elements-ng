---
"@pie-element/mc-populated-blank": patch
---

A word box drawn as a bordered table in an r1 token stem sits in line with the blank, as in Learnosity (PIE-1557). The stem kept its whitespace, so the newlines an author left around the box's table showed as an empty line and pushed the box a line below the blank; the r1 token layouts now collapse whitespace as any HTML does, and every other layout keeps it as before. The 150px box each stem token takes also reached the word inside the table, which grew the box from its authored 150px to about 200px and set the word at its bottom; a span inside a table now keeps its authored size, so the box is 150px with its word centred. Stems of 150px tokens and images lay out as before, and below 850px the stem still stacks at the left edge.
