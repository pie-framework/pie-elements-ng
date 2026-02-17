import type { MathEngineCommand } from '../types';
import { getDefaultMathCommandRegistry } from './registry';

export function commandToLatex(value: MathEngineCommand): string {
  return getDefaultMathCommandRegistry().toLatex(value);
}

export function isEmptyMathValue(latex: string | null | undefined): boolean {
  return !latex || latex.trim().length === 0;
}
