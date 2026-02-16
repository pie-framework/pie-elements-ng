/**
 * IIFE entry point for match element
 * This file is only used for IIFE builds and includes auto-registration
 *
 * @sync-generated - Auto-generated during sync from pie-elements
 */

import Element from './index';

// Auto-register the custom element for IIFE mode
if (typeof window !== 'undefined' && !customElements.get('match-element')) {
  customElements.define('match-element', Element);
}

// Export for IIFE global
export default Element;
