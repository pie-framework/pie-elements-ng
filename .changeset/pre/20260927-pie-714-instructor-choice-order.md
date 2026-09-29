---
'@pie-element/shared-controller-utils': patch
'@pie-element/categorize': patch
'@pie-element/drag-in-the-blank': patch
'@pie-element/ebsr': patch
'@pie-element/inline-dropdown': patch
'@pie-element/match': patch
'@pie-element/match-list': patch
'@pie-element/multiple-choice': patch
'@pie-element/mc-populated-blank': patch
---

The instructor role no longer locks the choice order, as in pie-elements: an instructor sees the order stored in the session, and a session with none gets a new shuffle, saved as for a student. inline-dropdown still shows an instructor the authored order in view and evaluate mode while choice rationales are enabled. A host that wants the authored order sets `env['@pie-element'].lockChoiceOrder`. (PIE-714)
