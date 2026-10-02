---
  "@pie-lib/charting": patch
  "@pie-lib/graphing": patch
  "@pie-lib/graphing-solution-set": patch
  "@pie-lib/plot": patch
  "@pie-lib/rubric": patch
---

Resolve ESM-first and externalize the @hello-pangea/dnd and react-redux chain so built bundles no longer emit a require('react') shim that throws in the browser
