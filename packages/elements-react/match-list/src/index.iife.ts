/**
 * IIFE entry point for match-list element
 * This file is only used for IIFE builds and includes auto-registration
 *
 * @sync-generated - Auto-generated during sync from pie-elements
 */

import Element from './index';

// Auto-register the custom element for IIFE mode
if (typeof window !== 'undefined' && !customElements.get('match-list-element')) {
  customElements.define('match-list-element', Element);
}

// Export for IIFE global
export default Element;
