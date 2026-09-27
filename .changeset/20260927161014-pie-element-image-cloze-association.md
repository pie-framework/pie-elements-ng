---
  "@pie-element/image-cloze-association": patch
---

Fix importing `./controller` in Node, which failed with "Named export 'camelizeKeys' not found" because the controller named-imported the CommonJS `humps` package.
