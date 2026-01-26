/**
 * Slider Element - Public API
 *
 * Corresponds to QTI 2.2 sliderInteraction
 */

// Default export: Manual wrapper (proven to work)
export { default } from './element/index.js';

// Named exports: Components and utilities
export { default as SliderComponent } from './slider.component.svelte';
export * from './slider.controller.js';
export * from './slider.types.js';
