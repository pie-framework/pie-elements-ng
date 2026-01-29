/**
 * MathQuill - ESM Entry Point
 * PIE Framework fork with matrix support, accessibility, and custom symbols
 *
 * This is a modernized ESM wrapper around the original MathQuill IIFE code.
 * The IIFE has been modified to:
 * 1. Accept jQuery as a parameter instead of expecting it globally
 * 2. Return the MathQuill object instead of attaching to window
 *
 * This approach avoids global scope pollution and works properly in ESM environments.
 *
 * @see https://github.com/pie-framework/mathquill
 */
import jQuery from 'jquery';

// Import the concatenated legacy bundle function
// This contains all MathQuill source: intro + sources + outro
// The IIFE accepts jQuery as parameter and returns MathQuill
import mathquillFactory from './legacy/mathquill-bundle.js';

// Import CSS
import './css/main.less';

// Initialize MathQuill by passing jQuery to the factory function
const MathQuill = mathquillFactory(jQuery);

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
