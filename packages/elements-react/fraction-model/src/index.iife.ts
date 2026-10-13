/**
 * IIFE entry point for fraction-model element
 * This file is only used for IIFE builds and includes auto-registration
 */

import Element from './index.js';

// Auto-register the custom element for IIFE mode
if (typeof window !== 'undefined' && !customElements.get('fraction-model-element')) {
  customElements.define('fraction-model-element', Element);
}

// Export for IIFE global
export default Element;
