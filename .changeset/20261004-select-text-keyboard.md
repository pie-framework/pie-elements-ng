---
"@pie-element/select-text": patch
"@pie-lib/text-select": patch
"@pie-lib/translator": patch
---

Students can select select-text tokens from the keyboard. The text is one tab stop: the arrow keys, Home and End move between tokens, and Space or Enter toggles the focused token, writing the session as a click does. Screen readers hear each token as a toggle button with its pressed state and position, inside a group named "Selectable text" that adds "select up to N" when the item sets a limit; evaluate describes each marked token by its Legend label, in English or Spanish. At the selection limit, unselected tokens stay in the sequence as unavailable tokens instead of becoming plain text, and look as before.
