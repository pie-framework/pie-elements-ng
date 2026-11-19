---
"@pie-element/simple-cloze": patch
"@pie-element/mc-populated-blank": patch
"@pie-element/venn-classification": patch
"@pie-element/video-stimulus": patch
"@pie-lib/delivery-events-svelte": patch
"@pie-lib/media-svelte": patch
---

The Svelte elements' interface strings ship in fourteen interface languages and follow the interface locale a player publishes, else the item's declared language, else US English: the correct-answer and teacher-instructions toggles, status messages, blank and choice names, the Venn tray, region and tile names with their announcements, and the video's status messages and transcript controls. An element first renders once its language has loaded, so it shows no English frame first. The element keeps the item's declared language as its content `lang`, and stamps none for an item that declares none. A video stimulus with no declared language no longer reads as English, and its authored `uiText` overrides apply in every interface language.
