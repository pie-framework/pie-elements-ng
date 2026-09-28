---
  "@pie-lib/test-utils": patch
---

add touch-input helpers for component tests

`touchStart`, `touchMove`, `touchEnd`, `touchTap`, `touchDrag` and
`dispatchTouchEvent` dispatch real DOM touch events with browser-accurate touch
lists, so tests reach the native non-passive listeners drag libraries register
for touch. `fireEvent.touchStart` does not, which is how a drag handle can pass
every desktop test and still be inert on an iPad (PIE-1074).
