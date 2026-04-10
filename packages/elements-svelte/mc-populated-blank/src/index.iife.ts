/**
 * IIFE entry for mc-populated-blank delivery.
 * Registration is handled by PIE players/loaders, not by the element bundle itself.
 */
import Element from './delivery';
import * as controllerModule from './controller';

// Ensure the IIFE package exposes a plain controller object with callable
// `model`/`outcome` functions on the top-level `controller` property.
const controller = { ...controllerModule };

export { controller };
export default Element;
