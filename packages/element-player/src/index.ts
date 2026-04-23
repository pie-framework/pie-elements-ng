/**
 * PIE Element Player
 *
 * Self-contained web components for rendering PIE elements.
 * Handles element loading, math rendering, and session management internally.
 *
 * Usage:
 *   <pie-element-player element-name="hotspot" view="delivery"></pie-element-player>
 *   <pie-element-player element-name="hotspot" view="print" role="student"></pie-element-player>
 */

// Import Tailwind CSS + DaisyUI
import './app.css';

// Import players to register them as custom elements
import './players/index.js';

// Re-export types
export type { ElementPlayerProps, PieController, Tab } from './lib/types.js';
export type { ElementPlayerStrategy, ElementPlayerView } from './lib/player-strategy.js';
export type {
  RuntimeSupportCheck,
  RuntimeSupportStrategy,
  RuntimeSupportView,
  PieElementRuntimeSupport,
} from './lib/runtime-support.js';
export { normalizeRuntimeSupportCheck } from './lib/runtime-support.js';
export {
  normalizeElementPlayerStrategy,
  normalizeElementPlayerView,
  resolveElementPlayerView,
} from './lib/player-strategy.js';
export {
  configureUnifiedPlayerResolver,
  type ControllerLoadDiagnostic,
  type RuntimeSupportDiagnostic,
} from './lib/unified-player-loader.js';
export {
  configureIifeBundleLoader,
  IifeBundleLoadError,
  type IifeBuildClient,
  type IifeRegistryClient,
  type IifeBundleLoaderAdapters,
  type IifeBundleRetryConfig,
  type IifeBundleRetryStatus,
  DEFAULT_IIFE_BUNDLE_RETRY_CONFIG,
} from './lib/iife-bundle-loader.js';
