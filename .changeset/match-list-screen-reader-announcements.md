---
"@pie-element/match-list": minor
---

Screen reader announcements follow the PIE-836 match-list spec. Before the objects, a hidden intro gives the object count, whether answer choices can be reused, the keys to use and how many drop areas are filled; each object is read with its drop area's state, and the available answer choices are listed after the last one. A focused answer choice is named for the choice, and for the object it sits in, in place of dnd-kit's "draggable". While a choice is selected, each drop area and the pool is announced with what ENTER will do there, and a drop, move, removal or cancel is announced with how many drop areas are filled and how many answer choices remain.
