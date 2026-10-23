---
"@pie-element/cli": patch
---

Check that declared workspace dependencies resolve to their workspace package
directories before import analysis, including packages with no build output or
source imports. Report stale forwarding directories, missing or broken links,
and links into another checkout as dependency-integrity failures.
