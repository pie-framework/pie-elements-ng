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
// These templates are not used in pie-elements-ng runtime or are temporarily disabled.
export const EXCLUDED_UPSTREAM_ELEMENTS = [
  'boilerplate-item-type',
  'math-inline',
  'math-templated',
] as const;

// Build tool versions
export const BUILD_TOOLS = {
  VITE: '^6.0.0',
  TYPESCRIPT: '^5.9.3',
  VITE_REACT_PLUGIN: '^4.2.0',
  LODASH_ES: '^4.17.22',
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
export const SCRIPTS = {
  BUILD: 'bun x vite build && bun x tsc --emitDeclarationOnly',
  BUILD_WITH_IIFE:
    'bun x vite build && bun x vite build --config vite.config.iife.ts && bun x tsc --emitDeclarationOnly',
  DEV: 'bun x vite',
  DEMO: 'bun x vite --mode demo',
  TEST: 'bun x vitest run',
} as const;

// Compatibility report file
export const COMPATIBILITY_FILE = './.compatibility/report.json';

// Upstream history file
export const HISTORY_FILE = '.upstream-sync-history.json';
