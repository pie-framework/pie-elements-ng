/**
 * IIFE entry point for graphing element
 * This file is only used for IIFE builds and includes auto-registration
 */

import Element from './index.js';

// Auto-register the custom element for IIFE mode
if (typeof window !== 'undefined' && !customElements.get('graphing-element')) {
  customElements.define('graphing-element', Element);
}

// Export for IIFE global
export default Element;
