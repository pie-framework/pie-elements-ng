import type { Correctness } from './types';

/**
 * Normalize correctness value to standard format
 * Converts 'partially-correct' to 'partial' for consistency
 */
export function normalizeCorrectness(correctness: string): Correctness {
  if (correctness === 'partially-correct') {
    return 'partial';
  }
  return correctness as Correctness;
}
