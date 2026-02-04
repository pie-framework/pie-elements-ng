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

// Use the extension loader which initializes Desmos + all patches
import MQ from './extensions/index.js';

// Re-export for backward compatibility with consuming packages
export default MQ;
export const getInterface = MQ.getInterface;

// Re-export types from Desmos MathQuill
export type {
  MathQuillInterface,
  MathFieldInterface,
  StaticMathInterface,
  MathFieldConfig,
} from 'mathquill';
