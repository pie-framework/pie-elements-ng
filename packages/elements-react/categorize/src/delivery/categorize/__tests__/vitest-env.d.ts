// Pulls in `@testing-library/jest-dom/vitest`'s ambient module augmentation of Vitest's
// `Assertion` interface (adds `toBeInTheDocument`, `toHaveAttribute`, `toHaveStyle`, etc.)
// so `tsc --noEmit` sees the same matcher types the tests actually use at runtime.
//
// `vitest.setup.ts` at the package root already performs the *runtime* registration of
// these matchers (`import '@testing-library/jest-dom/vitest'`) via the `test.setupFiles`
// Vite config option, but that file lives outside `src/` and this package's `tsconfig.json`
// only includes `src/**/*` — so tsc's program never sees it, and the module augmentation
// never applies. This file is a type-only counterpart, scoped to `src`, that exists purely
// so `tsc` can resolve the same matcher types Vitest resolves at runtime.
import '@testing-library/jest-dom/vitest';
