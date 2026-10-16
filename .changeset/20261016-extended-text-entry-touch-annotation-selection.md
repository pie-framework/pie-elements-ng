---
"@pie-element/extended-text-entry": patch
---

A scorer can select text by touch to open the annotation menu. The annotation editor read the selection only on `mouseup`, which a touch selection never produces; it now also reads the selection once it has stopped changing after a touch or pen interaction. The mouse path is unchanged.
