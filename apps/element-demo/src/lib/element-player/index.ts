/**
 * PIE Element Player
 *
 * A Svelte component for rendering PIE elements in the demo app.
 * Loads elements dynamically, handles mode switching, session management,
 * and controller integration.
 *
 * Usage:
 *   <PieElementPlayer
 *     elementName="hotspot"
 *     {model}
 *     {session}
 *     mode="gather"
 *     showConfigure={true}
 *   />
 */

export { default as PieElementPlayer } from './PieElementPlayer.svelte';

// Re-export types
export type { ElementPlayerProps, PieController, Tab } from './lib/types';
