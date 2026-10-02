/**
 * IIFE entry point for drawing-response element
 * This file is only used for IIFE builds and includes auto-registration
 */

import Element from './index.js';

// Auto-register the custom element for IIFE mode
if (typeof window !== 'undefined' && !customElements.get('drawing-response-element')) {
  customElements.define('drawing-response-element', Element);
}

// Export for IIFE global
export default Element;
