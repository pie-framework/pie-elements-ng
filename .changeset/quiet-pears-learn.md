---
"@pie-element/multiple-choice": patch
---

The chrome follows the locale the player publishes through the interface-locale context, else the
item's declared language, else `en-US`, and the resolved locale now reaches the React tree: the
region label, the SR heading, the selection-count text and the correct-answer toggle all render
it, where the element previously localized only its region label and left the component chrome on
English. Republishes re-render without a remount. The element host still names the content
language alone (`lang`/`dir` for a declared language, nothing otherwise).
