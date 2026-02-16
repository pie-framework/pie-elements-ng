/**
 * MathQuill - ESM Entry Point
 * Desmos fork with Khan patches, Learnosity features, and PIE extensions
 *
 * This package uses the Desmos MathQuill fork as a base and layers on:
 * - Khan Academy: Mobile keyboard fixes, i18n ARIA strings
 * - Learnosity: Recurring decimals, not-less/greater symbols, empty() method
 * - PIE: Matrix commands, LRN exponent notation
 *
 * All extensions are loaded via the extension loader.
 *
 * Migrated: 2026-02-03
 * Base: github:desmosinc/mathquill
 */

// IMPORTANT: jQuery MUST be set up before MathQuill imports
// This import has side effects that set window.jQuery
import './jquery-setup.js';

// Now import MathQuill UMD bundle - it will find jQuery on window
import 'mathquill/build/mathquill.js';

// Import extensions which initializes window.MathQuill with all patches
import './extensions/index.js';

// Export the base MathQuill object from window (has getInterface method)
// This maintains backward compatibility with code that calls MathQuill.getInterface()
const MathQuill = (typeof window !== 'undefined' && window.MathQuill) as any;

export default MathQuill;

// Re-export types from Desmos MathQuill
export type {
  MathQuillInterface,
  MathFieldInterface,
  StaticMathInterface,
  MathFieldConfig,
} from 'mathquill';
