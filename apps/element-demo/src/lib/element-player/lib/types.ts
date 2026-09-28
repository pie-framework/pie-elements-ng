/**
 * TypeScript type definitions for PIE Element Player
 */

export interface PieController {
  model?: (config: any, session: any, env: any) => Promise<any>;
  score?: (model: any, session: any) => Promise<any>;
  outcome?: (model: any, session: any, env: any) => Promise<any>;
  createCorrectResponseSession?: (model: any, env: any) => Promise<any>;
}
