---
"@pie-element/shared-math-rendering-mathjax": minor
---

The `./assets` export gives a host that bundles elements the URL of every file the browser build loads, MathJax's web fonts and the speech worker with its rule files, keyed by npm path. Passed as `math: { assetUrls }` to `registerPreloadedElements`, it replaces a hosted `assetRoot`. The keys carry the MathJax version, so install the version of this package that the elements depend on. The manifest lists the paths of each asset package that the browser build loads under `pie.browserAssetPaths`, beside their versions in `pie.assetPackages`.
