---
"@pie-element/placement-ordering": patch
---

Stop the screen reader reading extra text around the spec's announcements (PIE-835). dnd-kit's pick-up instructions ("Press SPACE or ENTER to pick up this answer choice. Once picked up use TAB…") and its "Draggable" role description are no longer attached to the tiles, so they no longer follow rows 8 and 9 or come before rows 16 to 20; each tile's label already says what to press. The result of a drop or a cancel is now said 300ms later, once focus has settled on its tile, in an assertive live region, so it cuts off the reading of that tile instead of following it. The `dragInstructions` catalog key is removed from every locale.
