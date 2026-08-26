# Video stimulus demo fixtures

All files in this directory are original repository fixtures with no third-party content.

- `sample.webm` is a 12-second, 854×480 lab-safety slide lesson generated for this repository. Its three SVG slides are rasterized with headless Chromium, its English narration is synthesized with the macOS `say` command, and FFmpeg encodes VP9 video plus Opus audio.
- `captions-en.vtt` transcribes the synthesized narration and aligns one cue to each four-second slide.
- `poster.svg` is original placeholder artwork for the same lab-safety lesson.

The fixture exists to prove native playback, captions, transcript, and timed question cues without a network or licensing dependency. Caption timing and audio-description adequacy still require manual accessibility review when the production element is evaluated across supported browsers and assistive technologies.
