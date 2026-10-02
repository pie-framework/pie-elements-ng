/**
 * IIFE entry point for match-list element
 * This file is only used for IIFE builds and includes auto-registration
 */

import Element from './index.js';

// Auto-register the custom element for IIFE mode
if (typeof window !== 'undefined' && !customElements.get('match-list-element')) {
  customElements.define('match-list-element', Element);
}

// Export for IIFE global
export default Element;
