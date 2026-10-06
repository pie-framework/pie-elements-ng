---
"@pie-element/extended-text-entry": patch
"@pie-element/video-stimulus": patch
"@pie-lib/editable-html-tip-tap": patch
"@pie-lib/math-toolbar": patch
"@pie-lib/media-svelte": patch
---

The extended-text-entry annotation menu has a #757575 outline and pointer, and the freeform annotation editor keeps its green or pink band between two #757575 rings, so both meet 3:1 against the annotation colours, the page and the menu in every theme. The math toolbar's Done check is a darker green (#388E3C) that meets 3:1 on the toolbar, on white and under the dark theme, and the editor toolbar's Done check takes the same green unless a host sets `--editable-html-toolbar-check`. The video transcript toggle's border takes the text colour, and with no theme applied the toggle and the video retry button now show a border in the surrounding text colour.
