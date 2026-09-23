---
  "@pie-lib/editable-html-tip-tap": patch
---

Upload pasted images instead of inlining them as base64. The tiptap paste handler read the clipboard file into a data URL and inserted it as the node's `src` without ever calling `imageSupport.add`, so a pasted image was persisted inline - inflating the item by roughly a third of the file size and failing to save with a 413 for large images - while the toolbar button stored a short uploaded URL. Paste now inserts the data URL only as a preview and hands the file to the host through `insertImageRequested` with `isPasted` and `getChosenFile`, the same contract the toolbar path uses, so the stored markup carries the uploaded URL. `InsertImageHandler` also resolves its target node by `nodeKey` rather than by the position captured when the upload started, because nothing stops the author from typing while a pasted image uploads and a stale position wrote the uploaded URL onto the wrong node (PIE-1017)
