/**
 * Shared constants for upstream sync operations
 */

// Default repository paths
export const DEFAULT_PATHS = {
  PIE_ELEMENTS: '../pie-elements',
  PIE_LIB: '../pie-lib',
  PIE_ELEMENTS_NG: '.',
} as const;

// Workspace dependency patterns
export const WORKSPACE = {
  VERSION: 'workspace:*',
  PIE_LIB_PREFIX: '@pie-lib/',
  PIE_ELEMENT_PREFIX: '@pie-element/',
  PIE_FRAMEWORK_PREFIX: '@pie-framework/',
} as const;

// Upstream element packages intentionally excluded from sync.
// These templates are not used in pie-elements-ng runtime.
export const EXCLUDED_UPSTREAM_ELEMENTS = ['boilerplate-item-type'] as const;

// Upstream @pie-lib packages intentionally excluded from sync.
// math-rendering stays local (wrapper re-exports shared MathJax adapter).
export const EXCLUDED_UPSTREAM_PIE_LIB_PACKAGES = ['math-rendering'] as const;

// Build tool versions
export const BUILD_TOOLS = {
  VITE: '^8.0.1',
  TYPESCRIPT: '^5.9.3',
  VITE_REACT_PLUGIN: '^6.0.1',
} as const;

// React versions
export const REACT = {
  VERSION: '^18.0.0',
  TYPES_VERSION: '^18.2.0',
} as const;

// Directory patterns to skip
export const SKIP_PATTERNS = {
  TEST_DIRS: ['__tests__', '__mocks__'],
  FILE_EXTENSIONS: ['.js', '.jsx', '.ts', '.tsx'],
} as const;

// File types
export const FILE_TYPES = {
  JS: '.js',
  JSX: '.jsx',
  TS: '.ts',
  TSX: '.tsx',
} as const;

// Package.json defaults
export const PACKAGE_DEFAULTS = {
  TYPE: 'module',
  SIDE_EFFECTS: false,
  FILES: ['dist', 'src'],
} as const;

// Build scripts
export const ELEMENT_BROWSER_VITE_CONFIG = '../../../tools/vite/element-browser.config.ts';
export const ELEMENT_LEGACY_PRINT_VITE_CONFIG =
  '../../../tools/vite/element-legacy-print.config.ts';

export type ElementBuildLanes = {
  /** dist/browser/** - the browser ESM surface consumed by pie-players. */
  browser?: boolean;
  /**
   * module/print.js - a self-contained print bundle (React inlined, zero
   * externals) for the unmodified @pie-framework/pie-print client loader, which
   * uses a bare import() with no import map and so cannot read exports["./print"].
   * See PIE-839 and docs/PRINT_SUPPORT.md.
   */
  legacyPrint?: boolean;
  /** dist/index.iife.js - the fully self-contained script-tag surface. */
  iife?: boolean;
};

/**
 * Compose a synced element's build script from the lanes it needs.
 *
 * Composed rather than enumerated on purpose. This used to be four hardcoded
 * constants covering the browser/iife combinations, so when PIE-839 added the
 * legacy print lane there was nowhere for it to live: it was written straight
 * into the twelve print-enabled manifests, and the next sync regenerated
 * `scripts.build` from the constants and silently dropped it. Print then broke
 * for every synced element with no failing check. Adding a lane here keeps it in
 * the generated output instead of relying on a hand-edited manifest surviving.
 */
export function composeElementBuildScript(lanes: ElementBuildLanes = {}): string {
  const steps = ['bun x vite build'];
  if (lanes.browser) {
    steps.push(`bun x vite build --config ${ELEMENT_BROWSER_VITE_CONFIG}`);
  }
  if (lanes.legacyPrint) {
    steps.push(`bun x vite build --config ${ELEMENT_LEGACY_PRINT_VITE_CONFIG}`);
  }
  if (lanes.iife) {
    steps.push('bun x vite build --config vite.config.iife.ts');
  }
  steps.push('bun x tsc --emitDeclarationOnly');
  return steps.join(' && ');
}

// Derived from composeElementBuildScript so the named variants cannot drift from
// the composer. Prefer calling the composer directly for new lane combinations.
export const SCRIPTS = {
  BUILD: composeElementBuildScript(),
  BUILD_WITH_BROWSER: composeElementBuildScript({ browser: true }),
  BUILD_WITH_IIFE: composeElementBuildScript({ iife: true }),
  BUILD_WITH_IIFE_AND_BROWSER: composeElementBuildScript({ browser: true, iife: true }),
  DEV: 'bun x vite',
  DEMO: 'bun x vite --mode demo',
  TEST: 'bun x vitest run',
} as const;

// Compatibility report file
export const COMPATIBILITY_FILE = './.compatibility/report.json';

// Upstream history file
export const HISTORY_FILE = '.upstream-sync-history.json';
