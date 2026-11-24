---
"@pie-element/match-list": patch
---

Fixes from accessibility review of the match-list screen reader announcements (PIE-836). Selecting an answer choice now reads row 8 ("Selected answer choice … Use TAB to choose a drop area") instead of the row 12 text dnd-kit's initial "over" event used to put in its place; row 12 is read only once focus comes back to the pool. Cancelling with ESC reads row 9 ("Use TAB to move to an answer choice"), a new `cancelledA11y` key in every locale. All announcements now go through a single assertive live region, so they cut each other off instead of queueing and no longer compete in JAWS.
