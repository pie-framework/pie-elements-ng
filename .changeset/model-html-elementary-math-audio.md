---
'@pie-element/shared-utils': patch
---

`sanitizeModelHtml` keeps elementary math (`mstack`, `mlongdiv` and their groups, rows, lines and carries, with their attributes) and `mspace`'s `linebreak`, which it reduced to a row of digits. A link whose handler only plays an `<audio>` by id, as Star's listening prompts do, plays it again: the sanitizer moves the id to `data-pie-play-audio`, and one document listener plays it.
