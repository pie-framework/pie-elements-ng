/**
 * IIFE entry point for match element
 * This file is only used for IIFE builds and includes auto-registration
 */

import Element from './index.js';

// Auto-register the custom element for IIFE mode
if (typeof window !== 'undefined' && !customElements.get('match-element')) {
  customElements.define('match-element', Element);
}

// Export for IIFE global
export default Element;
