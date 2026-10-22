---
"@pie-element/shared-utils": patch
"@pie-element/multiple-choice": patch
"@pie-element/hotspot": patch
"@pie-element/categorize": patch
"@pie-element/drag-in-the-blank": patch
"@pie-element/image-cloze-association": patch
"@pie-element/mc-populated-blank": patch
---

The prompt-audio elements share one implementation of autoplay, `completeAudioEnabled` and audio
timing from `@pie-element/shared-utils`. image-cloze-association now records `audioStartTime`,
`audioEndTime` and `waitTime` like the others, so the session changes when its prompt audio ends
(PIE-1340).
