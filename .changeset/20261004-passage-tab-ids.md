---
"@pie-element/passage": patch
---

Passage tabs and panels take ids built from a per-passage generated prefix and keep `button-N` and `tabpanel-N` as classes, so two passages on one page render each id once, each tab's `aria-controls` and each panel's `aria-labelledby` resolve inside their own passage, and arrow keys move focus only among that passage's tabs. Authored CSS that selects `#button-N` or `#tabpanel-N` must select `.button-N` or `.tabpanel-N` instead.
