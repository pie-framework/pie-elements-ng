---
"@pie-element/multiple-choice": minor
"@pie-element/categorize": minor
"@pie-element/hotspot": minor
"@pie-element/drag-in-the-blank": minor
"@pie-element/image-cloze-association": minor
"@pie-element/mc-populated-blank": minor
---

`completeAudioEnabled` now works on its own. With prompt audio present, the item only reports `complete: true` once the audio has played to the end, whether autoplay, the audio button or the native controls started it. Previously the setting only took effect when `autoplayAudioEnabled` was also on.

Behaviour change for hosts that set `completeAudioEnabled` without `autoplayAudioEnabled`: those items no longer report complete right after a response; they wait for the prompt audio to finish. The "click to enable audio" overlay still only appears with autoplay on.
