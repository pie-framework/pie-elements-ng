---
"@pie-lib/editable-html-tip-tap": minor
---

The new `idleSaveDelay` prop makes the editor save once the user stops typing for that many milliseconds, not only on blur: it commits the content and calls `onDone`, as a blur does. Without the prop the editor saves on blur only, as before. A pending save still goes out when the editor is unmounted or replaced before the delay runs out, and the save waits while a toolbar is open or a composition (IME, dictation) is in progress.
