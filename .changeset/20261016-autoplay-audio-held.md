---
"@pie-element/shared-utils": patch
"@pie-lib/render-ui": patch
"@pie-element/categorize": patch
"@pie-element/drag-in-the-blank": patch
"@pie-element/hotspot": patch
"@pie-element/image-cloze-association": patch
"@pie-element/multiple-choice": patch
"@pie-element/ebsr": patch
"@pie-element/mc-populated-blank": patch
---

Prompt audio honours `autoplayAudioHeld`, which pie-players' item player writes when the host holds autoplay: the audio does not start on its own and the learner gets native controls to start it. EBSR holds both parts. The model sanitizer drops authored `autoplay`, so the model setting is the only start. Completion no longer waits on prompt audio that failed to load, has no source, or that a resumed session (`audioEndTime`) already played.
