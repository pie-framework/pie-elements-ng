/**
 * IIFE entry point for multi-trait-rubric element
 * This file is only used for IIFE builds and includes auto-registration
 */

import Element from './index.js';

// Auto-register the custom element for IIFE mode
if (typeof window !== 'undefined' && !customElements.get('multi-trait-rubric-element')) {
  customElements.define('multi-trait-rubric-element', Element);
}

// Export for IIFE global
export default Element;
