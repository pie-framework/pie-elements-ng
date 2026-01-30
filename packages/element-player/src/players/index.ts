/**
 * PIE Element Players
 *
 * ESM player for loading elements via ES module imports with import maps
 */

// Import component to register it as a custom element
import './EsmElementPlayer.svelte';

// Re-export component for programmatic use
export { default as EsmElementPlayer } from './EsmElementPlayer.svelte';
