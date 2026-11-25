---
"@pie-lib/mask-markup": patch
"@pie-element/drag-in-the-blank": patch
---

The answer choices come after the text in the DOM when they show below or right of it, and before it when they show above or left of it (PIE-1553). They showed below or right through a reversed flex direction, so they still came first in the DOM, and so first in the tab path, the reading order and text-to-speech, which read the choices before the sentence they complete. The flex direction is no longer reversed, and the layout on screen is unchanged.
