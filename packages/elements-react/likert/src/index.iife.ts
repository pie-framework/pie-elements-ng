/**
 * IIFE entry point for likert element
 * This file is only used for IIFE builds and includes auto-registration
 */

import Element from './index.js';

// Auto-register the custom element for IIFE mode
if (typeof window !== 'undefined' && !customElements.get('likert-element')) {
  customElements.define('likert-element', Element);
}

// Export for IIFE global
export default Element;
