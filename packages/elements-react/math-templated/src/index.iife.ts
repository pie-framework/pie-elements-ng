/**
 * IIFE entry point for math-templated element
 * This file is only used for IIFE builds and includes auto-registration
 *
 * @sync-generated - Auto-generated during sync from pie-elements
 */

import Element from './index';

// Auto-register the custom element for IIFE mode
if (typeof window !== 'undefined' && !customElements.get('math-templated-element')) {
  customElements.define('math-templated-element', Element);
}

// Export for IIFE global
export default Element;
