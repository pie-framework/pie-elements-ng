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

import MQ from './extensions/index.js';

type CompatMathQuill = typeof MQ & {
  getInterface?: (version: number) => typeof MQ;
};

const MathQuill = MQ as CompatMathQuill;

// Temporary compatibility shim while consumers migrate from getInterface(3) to direct API.
const originalGetInterface = MathQuill.getInterface;
MathQuill.getInterface = (version: number) => {
  if (!originalGetInterface) {
    return MQ;
  }

  try {
    return originalGetInterface(version);
  } catch {
    // Older runtimes may not support the requested interface (for example v3).
    for (const fallbackVersion of [2, 1]) {
      try {
        return originalGetInterface(fallbackVersion);
      } catch {
        // Continue trying lower versions.
      }
    }
    return MQ;
  }
};

export default MathQuill;

// Re-export types from Desmos MathQuill
export type {
  MathQuillInterface,
  MathFieldInterface,
  StaticMathInterface,
  MathFieldConfig,
} from 'mathquill';
