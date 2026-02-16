export type PlayerType = 'esm' | 'iife';

export const DEFAULT_PLAYER_TYPE: PlayerType = 'esm';

export function parsePlayerType(value: string | null): PlayerType {
  return value === 'iife' ? 'iife' : 'esm';
}
