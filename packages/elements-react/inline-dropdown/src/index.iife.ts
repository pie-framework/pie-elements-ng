/**
 * IIFE entry point for inline-dropdown element
 * This file is only used for IIFE builds and includes auto-registration
 *
 * @sync-generated - Auto-generated during sync from pie-elements
 */

import Element from './index.js';

// Auto-register the custom element for IIFE mode
if (typeof window !== 'undefined' && !customElements.get('inline-dropdown-element')) {
  customElements.define('inline-dropdown-element', Element);
}

// Export for IIFE global
export default Element;
