/**
 * Shared constants for upstream sync operations
 */

// Default repository paths
export const DEFAULT_PATHS = {
  PIE_ELEMENTS: '../pie-elements',
  PIE_LIB: '../pie-lib',
  PIE_ELEMENTS_NG: '.',
} as const;

/**
 * Module source substituted for `debug` in per-element IIFE builds. Carries the
 * module-level `debug.log` and the instance methods element code calls.
 */
export const IIFE_DEBUG_SHIM_SOURCE =
  "const noop = () => {}; function debug() { const log = function () {}; log.enabled = false; log.log = noop; log.extend = () => log; log.destroy = noop; return log; } debug.log = noop; debug.enable = noop; debug.disable = () => ''; debug.enabled = () => false; export default debug;";

/**
 * Module source substituted for `prop-types` in per-element IIFE builds. It mirrors
 * prop-types' production shims: every validator is callable and carries `isRequired`,
 * so `PropTypes.oneOf([...]).isRequired` evaluates at module load.
 */
export const IIFE_PROP_TYPES_SHIM_SOURCE =
  'const shim = function () { return null; }; shim.isRequired = shim; const getShim = () => shim; export const array = shim, bigint = shim, bool = shim, func = shim, number = shim, object = shim, string = shim, symbol = shim, any = shim, element = shim, elementType = shim, node = shim; export const arrayOf = getShim, instanceOf = getShim, objectOf = getShim, oneOf = getShim, oneOfType = getShim, shape = getShim, exact = getShim; export const checkPropTypes = () => {}; export const resetWarningCache = () => {}; const types = { array, bigint, bool, func, number, object, string, symbol, any, element, elementType, node, arrayOf, instanceOf, objectOf, oneOf, oneOfType, shape, exact, checkPropTypes, resetWarningCache }; types.PropTypes = types; export { types as PropTypes }; export default types;';

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
// translator lives in packages/shared: its strings serve the Svelte elements too.
export const EXCLUDED_UPSTREAM_PIE_LIB_PACKAGES = ['math-rendering', 'translator'] as const;

// Upstream source files that sync does not re-emit. Each was reachable from no entry of its
// package and was deleted here; the values are the files' `@synced-from` paths.
export const RETIRED_UPSTREAM_SOURCE_FILES: ReadonlySet<string> = new Set([
  'pie-elements/packages/graphing/src/utils.js',
  'pie-elements/packages/image-cloze-association/src/constants.js',
  'pie-elements/packages/likert/src/session-updater.js',
  'pie-elements/packages/match/configure/src/common.jsx',
  'pie-elements/packages/matrix/src/session-updater.js',
  'pie-elements/packages/number-line/src/number-line/point-chooser/styles.js',
  'pie-elements/packages/placement-ordering/configure/src/help.jsx',
  'pie-lib/packages/charting/src/tool-menu.jsx',
  'pie-lib/packages/drag/src/drag-type.js',
  'pie-lib/packages/drag/src/preview-component.jsx',
  'pie-lib/packages/editable-html-tip-tap/src/components/media/MediaWrapper.jsx',
  'pie-lib/packages/editable-html-tip-tap/src/styles/editorContainerStyles.js',
  'pie-lib/packages/editable-html-tip-tap/src/theme.js',
  'pie-lib/packages/graphing-solution-set/src/toggle-bar.jsx',
  'pie-lib/packages/graphing-solution-set/src/tools/polygon/line.jsx',
  'pie-lib/packages/graphing-solution-set/src/tools/shared/line/line-path.jsx',
  'pie-lib/packages/graphing-solution-set/src/tools/shared/line/with-root-edge.jsx',
  'pie-lib/packages/mask-markup/src/components/correct-input.jsx',
  'pie-lib/packages/mask-markup/src/components/input.jsx',
  'pie-lib/packages/math-input/src/math-input.jsx',
]);

// Build tool versions
export const BUILD_TOOLS = {
  VITE: '^8.0.1',
  TYPESCRIPT: '^5.9.3',
  VITE_REACT_PLUGIN: '^6.0.1',
} as const;

// React versions. Element packages also depend on React from ^18.2.0, the browser ESM policy
// version, so their peer range starts there.
export const REACT = {
  ELEMENT_PEER_RANGE: '^18.2.0 || ^19.0.0',
  LIBRARY_PEER_RANGE: '^18.0.0 || ^19.0.0',
  TYPES_VERSION: '^18.2.0',
} as const;

// Package.json defaults
export const PACKAGE_DEFAULTS = {
  TYPE: 'module',
  SIDE_EFFECTS: false,
  FILES: ['dist', 'src'],
} as const;

// Build scripts
export const ELEMENT_BROWSER_VITE_CONFIG = '../../../tools/vite/element-browser.config.ts';
export const ELEMENT_BROWSER_EDITOR_RUNTIME_VITE_CONFIG =
  '../../../tools/vite/element-browser-editor-runtime.config.ts';
export const ELEMENT_LEGACY_PRINT_VITE_CONFIG =
  '../../../tools/vite/element-legacy-print.config.ts';

export type ElementBuildLanes = {
  /** dist/browser/** - the browser ESM surface consumed by pie-players. */
  browser?: boolean;
  /**
   * dist/browser/editor-runtime/** - the browser build with the editor engine imported from
   * @pie-element/shared-editor-runtime, declared in pie.browserEditorRuntime. Needs `browser`.
   */
  editorRuntime?: boolean;
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
    if (lanes.editorRuntime) {
      steps.push(`bun x vite build --config ${ELEMENT_BROWSER_EDITOR_RUNTIME_VITE_CONFIG}`);
    }
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
