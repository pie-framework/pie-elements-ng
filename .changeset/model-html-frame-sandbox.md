---
"@pie-element/shared-utils": patch
---

Model HTML frames run in a fixed sandbox and permission policy: their own scripts, storage, sandboxed popups and form posts, fullscreen, picture-in-picture and protected media, with no navigation of the host page, dialogs, downloads, autoplay or device access (PIE-1580). A frame must load from an https origin other than the document's; a protocol-relative `src` loads over https, and authored `sandbox`, `allow` and `allowfullscreen` are replaced. Which origins frames may load is left to the host's CSP `frame-src`.

An `<object>` holding an image renders as an `<img>` with its attributes, and one written self-closing no longer hides the prompt text after it. Any other `<object>` is removed and its fallback content kept.
