/**
 * IIFE entry point for graphing-solution-set element
 * This file is only used for IIFE builds and includes auto-registration
 *
 * @sync-generated - Auto-generated during sync from pie-elements
 */

import Element from './index';

// Auto-register the custom element for IIFE mode
if (typeof window !== 'undefined' && !customElements.get('graphing-solution-set-element')) {
  customElements.define('graphing-solution-set-element', Element);
}

// Export for IIFE global
export default Element;
