/**
 * TypeScript type definitions for PIE Element Player
 */

export interface ElementPlayerProps {
  elementName: string;
  cdnUrl?: string;
  model?: any;
  session?: any;
  mode?: 'gather' | 'view' | 'evaluate';
  showConfigure?: boolean;
  addCorrectResponse?: boolean;
  debug?: boolean;
}

export interface PieController {
  model?: (config: any, session: any, env: any) => Promise<any>;
  score?: (model: any, session: any) => Promise<any>;
  outcome?: (model: any, session: any, env: any) => Promise<any>;
  createCorrectResponseSession?: (model: any, env: any) => Promise<any>;
}

export interface Tab {
  id: string;
  label: string;
  description?: string;
  disabled?: boolean;
}
