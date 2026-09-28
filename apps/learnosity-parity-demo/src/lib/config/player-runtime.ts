export type PlayerType = 'esm' | 'iife';

export function parsePlayerType(value: string | null): PlayerType {
  return value === 'iife' ? 'iife' : 'esm';
}
