---
"@pie-element/shared-utils": patch
---

Model HTML keeps an `<iframe>` only when its `src` is the https embed endpoint of a provider production content uses: YouTube, Vimeo, SoundCloud, JW Player, Kaltura, TED, Khan Academy, History, Edpuzzle, Giphy, Vocaroo, Google Drive, Docs and Maps, PhET, Desmos and Smarter Balanced sample items. Any other frame is removed, so content can no longer place a page from an origin of its choosing inside an element (PIE-1580). A protocol-relative `src` loads over https.

An `<object>` holding an image renders as an `<img>`, and one written self-closing no longer hides the prompt text after it. Any other `<object>` is removed and its fallback content kept.
