/**
 * IIFE entry point for number-line element
 * This file is only used for IIFE builds and includes auto-registration
 *
 * @sync-generated - Auto-generated during sync from pie-elements
 */

import Element from './index.js';

// Auto-register the custom element for IIFE mode
if (typeof window !== 'undefined' && !customElements.get('number-line-element')) {
  customElements.define('number-line-element', Element);
}

// Export for IIFE global
export default Element;
