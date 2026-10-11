---
"@pie-element/image-cloze-association": patch
---

With `shuffle` on, the controller saves the possible-response order in `session.shuffledValues` through `updateSession` and reuses it, so resuming or switching to evaluate keeps the order the student first saw. `lockChoiceOrder` on the model or in `env['@pie-element']` keeps the authored order.
