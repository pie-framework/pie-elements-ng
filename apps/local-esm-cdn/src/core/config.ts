import path from 'node:path';

/**
 * Build scope configuration
 */
export type BuildScope = 'none' | 'esm' | 'all';

/**
 * Configuration for the local ESM CDN
 */
export interface LocalEsmCdnConfig {
  /** Root path to the pie-elements-ng repository */
  repoRoot: string;

  /** Base URL for esm.sh (or alternative CDN) */
  esmShBaseUrl: string;

  /** Whether to run build before serving (standalone mode only) */
  preBuild?: boolean;

  /** Build scope: 'none' | 'esm' | 'all' */
  buildScope?: BuildScope;

  /** Enable debug logging */
  debug?: boolean;

  /** Custom path mappings (for advanced use cases) */
  pathMappings?: {
    '@pie-element'?: string;
    '@pie-lib'?: string;
    '@pie-framework'?: string;
  };
}

/**
 * Context object passed to the request handler
 */
export interface LocalEsmCdnContext {
  config: LocalEsmCdnConfig;
  cache?: Map<string, any>;
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: Partial<LocalEsmCdnConfig> = {
  esmShBaseUrl: 'https://esm.sh',
  preBuild: false,
  buildScope: 'esm',
  debug: false,
};

/**
 * Helper to determine repo root from apps/local-esm-cdn/src/core
 */
export function repoRootFromHere(): string {
  // apps/local-esm-cdn/src/core -> repo root
  return path.resolve(import.meta.dir, '..', '..', '..', '..');
}

/**
 * Parse build scope from string value
 */
function coerceBuildScope(v: string | undefined): BuildScope | null {
  if (!v) return null;
  const lower = v.toLowerCase();
  if (lower === 'none' || lower === 'esm' || lower === 'all') return lower;
  return null;
}

/**
 * Load configuration from environment variables
 */
export function loadConfigFromEnv(): Partial<LocalEsmCdnConfig> {
  const skipBuild =
    (process.env.LOCAL_ESM_CDN_SKIP_BUILD ?? '').toLowerCase() === 'true' ||
    process.env.LOCAL_ESM_CDN_SKIP_BUILD === '1';

  const buildScope = skipBuild
    ? 'none'
    : (coerceBuildScope(process.env.LOCAL_ESM_CDN_BUILD_SCOPE) ?? 'esm');

  const config: Partial<LocalEsmCdnConfig> = {
    repoRoot: process.env.PIE_ELEMENTS_NG_PATH || repoRootFromHere(),
    buildScope,
    debug: process.env.LOCAL_ESM_CDN_DEBUG === 'true' || process.env.LOCAL_ESM_CDN_DEBUG === '1',
  };

  // Only set esmShBaseUrl if explicitly provided via env var
  if (process.env.LOCAL_ESM_CDN_ESM_SH_BASE_URL) {
    config.esmShBaseUrl = process.env.LOCAL_ESM_CDN_ESM_SH_BASE_URL;
  }

  return config;
}

/**
 * Merge multiple configuration objects, with later objects taking precedence
 */
export function mergeConfig(...configs: Partial<LocalEsmCdnConfig>[]): LocalEsmCdnConfig {
  const merged = Object.assign({}, DEFAULT_CONFIG, ...configs);

  // Ensure repoRoot is set
  if (!merged.repoRoot) {
    merged.repoRoot = repoRootFromHere();
  }

  return merged as LocalEsmCdnConfig;
}

/**
 * Create a new context object with the given configuration
 */
export function createContext(config: LocalEsmCdnConfig): LocalEsmCdnContext {
  return {
    config,
    cache: new Map<string, any>(),
  };
}
