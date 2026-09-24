---
"@pie-element/venn-classification": patch
---

Placed tiles stay inside their region, with the diagram growing when a region fills, and every drop zone is at least 120×120 px. Screen-reader activation picks up and drops tiles, the author preview uses region-label overrides, and a restored complete session reports `complete: true` on load. Instructors see teacher instructions, collapsed, including when `teacherInstructionsEnabled` is unset (PIE-1075).
