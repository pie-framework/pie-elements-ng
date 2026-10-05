---
"@pie-lib/render-ui": patch
---

A prompt's audio player and custom play button take generated ids and keep `pie-prompt-audio-player` and `play-audio-button` as classes, and each prompt looks them up inside its own markup, so with two audio prompts on one page each one's autoplay and play button drive only its own audio. Authored CSS that selects `#pie-prompt-audio-player` or `#play-audio-button` must select `.pie-prompt-audio-player` or `.play-audio-button` instead.
