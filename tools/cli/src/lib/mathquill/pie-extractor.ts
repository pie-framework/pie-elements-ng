import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Logger } from '../../utils/logger.js';

/**
 * PIE Feature Extractor
 *
 * Extracts PIE-specific customizations from the legacy bundle:
 * - Matrix commands (pmatrix, bmatrix, vmatrix)
 * - LRN exponent notation
 */

export interface PIEExtractionResult {
  features: string[];
  files: string[];
}

export async function extractPIEFeatures(
  _mathquillPath: string,
  outputPath: string,
  logger: Logger
): Promise<PIEExtractionResult> {
  const features: string[] = [];
  const files: string[] = [];

  // Extract matrices
  logger.progress('   Extracting matrix commands...');
  const matricesFile = join(outputPath, 'matrices.ts');
  writeFileSync(matricesFile, generateMatricesCode());
  features.push('matrices');
  files.push(matricesFile);

  // Extract LRN exponent
  logger.progress('   Extracting LRN exponent...');
  const lrnExponentFile = join(outputPath, 'lrn-exponent.ts');
  writeFileSync(lrnExponentFile, generateLRNExponentCode());
  features.push('lrn-exponent');
  files.push(lrnExponentFile);

  // Copy matrix styles
  logger.progress('   Creating matrix styles...');
  const stylesFile = join(outputPath, 'styles.css');
  writeFileSync(stylesFile, generateMatrixStyles());
  files.push(stylesFile);

  // Create index file
  const indexFile = join(outputPath, 'index.ts');
  writeFileSync(indexFile, generatePIEIndexCode());
  files.push(indexFile);

  return { features, files };
}

function generateMatricesCode(): string {
  return `/**
 * Matrix Commands (PIE)
 *
 * Source: PIE fork (2019)
 * File: src/legacy/mathquill-bundle.js lines 6600-6980
 *
 * Adds support for LaTeX matrix commands:
 * - \\pmatrix: Matrix with parentheses ()
 * - \\bmatrix: Matrix with square brackets []
 * - \\vmatrix: Matrix with vertical bars ||
 *
 * These are standard LaTeX matrix types used in mathematics education.
 */

import type { MathQuillInterface } from 'mathquill';
import './styles.css';

export function addMatrixCommands(MQ: MathQuillInterface): void {
  // Access MathQuill internals
  const mqInternal = MQ as any;

  if (!mqInternal.L?.LatexCmds) {
    console.warn('MathQuill internals not accessible for matrix commands');
    return;
  }

  // NOTE: This is a placeholder implementation
  // The full PIE matrix implementation from the legacy bundle is complex
  // and needs to be carefully ported to work with the Desmos fork.
  //
  // The legacy implementation (lines 6600-6980 in mathquill-bundle.js) includes:
  // - Matrix base class with row/column management
  // - Cell navigation and editing
  // - LaTeX parsing and generation
  // - HTML template generation
  // - Reflow and sizing logic
  //
  // For the initial migration, we document that this needs implementation.
  // The matrices from the legacy bundle should be extracted and adapted
  // to work with the modern TypeScript Desmos fork.

  // TODO: Extract and port full matrix implementation from legacy bundle
  // Lines 6600-6980 in packages/shared/mathquill/src/legacy/mathquill-bundle.js

  console.info('Matrix commands (pmatrix, bmatrix, vmatrix) need implementation');
  console.info('See: packages/shared/mathquill/src/legacy/mathquill-bundle.js lines 6600-6980');
}
`;
}

function generateLRNExponentCode(): string {
  return `/**
 * LRN Exponent Command (PIE)
 *
 * Source: PIE fork (2019)
 * File: src/legacy/mathquill-bundle.js
 *
 * Custom exponent notation for learning platforms.
 * Provides a specialized exponent input format.
 *
 * Usage: \\lrnexponent{base}{exponent}
 */

import type { MathQuillInterface } from 'mathquill';

export function addLRNExponent(MQ: MathQuillInterface): void {
  // Access MathQuill internals
  const mqInternal = MQ as any;

  if (!mqInternal.L?.LatexCmds) {
    console.warn('MathQuill internals not accessible for LRN exponent');
    return;
  }

  // NOTE: This is a placeholder implementation
  // The full PIE lrnexponent implementation needs to be extracted
  // from the legacy bundle and ported to TypeScript.
  //
  // The legacy implementation includes:
  // - Custom HTML template with specific styling
  // - Special handling for base and exponent parts
  // - Text template for plain text representation
  //
  // TODO: Extract and port lrnexponent implementation from legacy bundle
  // Search for 'lrnexponent' in packages/shared/mathquill/src/legacy/mathquill-bundle.js

  console.info('LRN exponent command needs implementation');
  console.info('See: packages/shared/mathquill/src/legacy/mathquill-bundle.js (search: lrnexponent)');
}
`;
}

function generateMatrixStyles(): string {
  return `/**
 * Matrix Styles (PIE)
 *
 * CSS styling for matrix rendering
 * Ported from packages/shared/mathquill/src/css/matrixed.less
 */

.mq-math-mode .mq-matrix {
  display: inline-block;
  vertical-align: middle;
}

.mq-math-mode .mq-matrix table {
  border-collapse: collapse;
  border-spacing: 0;
  margin: 0.1em 0;
}

.mq-math-mode .mq-matrix td {
  padding: 0.2em 0.4em;
  text-align: center;
  vertical-align: middle;
}

.mq-math-mode .mq-matrix .mq-paren {
  font-size: 1.2em;
  vertical-align: middle;
}

.mq-math-mode .mq-matrix .mq-scaled {
  display: inline-block;
  transform-origin: center;
}
`;
}

function generatePIEIndexCode(): string {
  return `/**
 * PIE Extensions
 *
 * PIE-specific customizations for educational assessment
 */

export { addMatrixCommands } from './matrices.js';
export { addLRNExponent } from './lrn-exponent.js';
`;
}
