/**
 * IIFE entry point for hotspot element
 * This file is only used for IIFE builds and includes auto-registration
 *
 * @sync-generated - Auto-generated during sync from pie-elements
 */

import Element from './index';

// Auto-register the custom element for IIFE mode
if (typeof window !== 'undefined' && !customElements.get('hotspot-element')) {
  customElements.define('hotspot-element', Element);
}

// Export for IIFE global
export default Element;
