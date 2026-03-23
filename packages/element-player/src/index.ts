/**
 * PIE Element Player
 *
 * Self-contained web components for rendering PIE elements.
 * Handles element loading, math rendering, and session management internally.
 *
 * Usage:
 *   <pie-esm-element-player element-name="hotspot"></pie-esm-element-player>
 *   <pie-esm-print-player element-name="hotspot" role="student"></pie-esm-print-player>
 */

// Import Tailwind CSS + DaisyUI
import './app.css';

// Export unified player plus compatibility wrappers.
export { PieElementPlayer, EsmElementPlayer, EsmPrintPlayer } from './players/index.js';

// Import players to register them as custom elements
import './players/index.js';

// Re-export types
export type { ElementPlayerProps, PieController, Tab } from './lib/types.js';
export type { ElementPlayerStrategy, ElementPlayerView } from './lib/player-strategy.js';
export {
  normalizeElementPlayerStrategy,
  normalizeElementPlayerView,
  resolveElementPlayerView,
} from './lib/player-strategy.js';
