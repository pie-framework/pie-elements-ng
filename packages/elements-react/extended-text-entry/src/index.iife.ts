/**
 * IIFE entry point for extended-text-entry element
 * This file is only used for IIFE builds and includes auto-registration
 *
 * @sync-generated - Auto-generated during sync from pie-elements
 */

import Element from './index';

// Auto-register the custom element for IIFE mode
if (typeof window !== 'undefined' && !customElements.get('extended-text-entry-element')) {
  customElements.define('extended-text-entry-element', Element);
}

// Export for IIFE global
export default Element;
