/**
 * IIFE entry point for complex-rubric element
 * This file is only used for IIFE builds and includes auto-registration
 */

import Element from './index.js';

// Auto-register the custom element for IIFE mode
if (typeof window !== 'undefined' && !customElements.get('complex-rubric-element')) {
  customElements.define('complex-rubric-element', Element);
}

// Export for IIFE global
export default Element;
