---
"@pie-element/mc-populated-blank": patch
---

The prompt, teacher instructions and show-correct-answer toggle now render above the stem on the grid layouts (`inline_sentence` with the Listen button, `token_sequence` and `stimulus_image_blank`), together in one `pie-header` block; before, they fell below the answer choices. An `iat-align-center` block is centred. A prompt that holds no text or media renders nothing, and the choices keep their own label.
