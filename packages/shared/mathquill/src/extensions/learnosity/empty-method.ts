/**
 * empty() Method (Learnosity)
 *
 * Source: Learnosity/mathquill@master
 * File: src/mathquill.js
 *
 * Adds an empty() method to MathField to check if it contains any content.
 * This is useful for form validation in assessment contexts.
 *
 * Returns true if the field contains no mathematical content (empty or whitespace only).
 */

import type { MathFieldInterface } from 'mathquill';

export function addEmptyMethod(MathFieldPrototype: any): void {
  // Add empty() method to MathField prototype
  if (!MathFieldPrototype.empty) {
    MathFieldPrototype.empty = function (this: MathFieldInterface): boolean {
      // Get the LaTeX content
      const latex = this.latex();

      // Empty if no content or only whitespace
      return !latex || latex.trim() === '';
    };
  }
}

export function applyEmptyMethod(MQ: any): void {
  // Apply empty() method to MathField instances
  const mqInternal = MQ as any;

  if (mqInternal.MathField && mqInternal.MathField.prototype) {
    addEmptyMethod(mqInternal.MathField.prototype);
  }
}
