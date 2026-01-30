/**
 * PIE Element Player
 *
 * A shared web component for rendering PIE elements in demo environments.
 * Loads elements dynamically, handles mode switching, session management,
 * and controller integration.
 *
 * Usage:
 *   <pie-element-player
 *     element-name="hotspot"
 *     cdn-url="http://localhost:5179"
 *     show-configure="false"
 *     debug="true"
 *   ></pie-element-player>
 */

// Import Tailwind CSS + DaisyUI
import './app.css';

export { default as PieElementPlayer } from './PieElementPlayer.svelte';

// Import the component to register it as a custom element
import './PieElementPlayer.svelte';

// Export ESM player
export { EsmElementPlayer } from './players';

// Import players to register them as custom elements
import './players';

// Re-export types
export type { ElementPlayerProps, PieController, Tab } from './lib/types';
