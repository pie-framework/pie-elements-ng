/**
 * MathQuill - ESM Entry Point
 * PIE Framework fork with matrix support, accessibility, and custom symbols
 *
 * This is a modernized ESM wrapper around the original MathQuill IIFE code.
 * The original source uses jQuery extensively and is wrapped in an IIFE that
 * attaches MathQuill to the window object. This wrapper:
 * 1. Imports jQuery and makes it globally available
 * 2. Imports the concatenated IIFE bundle
 * 3. Exports the MathQuill API from window
 *
 * @see https://github.com/pie-framework/mathquill
 */
import jQuery from 'jquery';

// Make jQuery available globally for MathQuill's internal code
// MathQuill expects window.jQuery to exist and uses it extensively
if (typeof window !== 'undefined') {
  window.jQuery = window.$ = jQuery;
}

// Import the concatenated legacy bundle
// This contains all MathQuill source: intro + sources + outro
// The bundle is wrapped in an IIFE that attaches MathQuill to window
import './legacy/mathquill-bundle.js';

// Import CSS
import './css/main.less';

// Get the MathQuill API from window (attached by the IIFE)
const MathQuill = (window as any).MathQuill;

// Export the MathQuill interface
export default MathQuill;

// Also export the getInterface function for versioned API access
export const getInterface = MathQuill?.getInterface;

// Re-export types for TypeScript users
export type {
  MathQuillInterface,
  MathField,
  StaticMath,
  MathFieldConfig,
} from './types';
