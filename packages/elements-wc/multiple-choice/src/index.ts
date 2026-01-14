/**
 * Web Component wrapper for @pie-element/multiple-choice
 * Framework-agnostic custom element that bundles React and all dependencies
 */

import * as controller from '@pie-element/multiple-choice/controller/src/index';
// Import from source to avoid pre-built externals
import MultipleChoiceElement, { isComplete } from '@pie-element/multiple-choice/src/index';

// Register the custom element if not already registered
if (!customElements.get('pie-multiple-choice')) {
  customElements.define('pie-multiple-choice', MultipleChoiceElement);
}

// Register controller in window.pie for PIE ESM player
if (typeof window !== 'undefined') {
  window.pie = window.pie || {};
  window.pie.default = window.pie.default || {};

  // Register in the format expected by registerPieElementsFromBundle
  // It expects: window.pie.default['@pie-wc/multiple-choice'] = { Element, controller, config }
  window.pie.default['@pie-wc/multiple-choice'] = {
    Element: MultipleChoiceElement,
    controller: controller,
    config: null, // Optional configuration
  };

  // Also register controller directly for backward compatibility
  window.pie['multiple-choice'] = controller;

  console.log('[multiple-choice] Registered controller in window.pie.default:', {
    package: '@pie-wc/multiple-choice',
    hasElement: !!MultipleChoiceElement,
    hasController: !!controller,
    controllerFunctions: Object.keys(controller),
  });
}

// Export for programmatic usage
export { MultipleChoiceElement, isComplete, controller };
export default MultipleChoiceElement;
