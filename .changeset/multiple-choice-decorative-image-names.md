---
"@pie-lib/render-ui": patch
"@pie-element/multiple-choice": patch
"@pie-element/image-cloze-association": patch
---

A multiple-choice choice whose only content is an image with an empty `alt` counts as nameless wherever the attribute falls in the tag, so the choice takes its letter as its name and authoring asks for alt text. `@pie-lib/render-ui` exports `hasTextAlternative`, the check image cloze association already used.
