/**
 * Core types for PIE bundler
 * Compatible with pie-api-aws interface
 */

export interface BuildDependency {
  name: string; // @pie-element/multiple-choice
  version: string; // 12.0.0
}

export interface BuildRequest {
  dependencies: BuildDependency[];
}

export interface BuildResult {
  success: boolean;
  hash: string;
  bundles?: {
    player: string;
    clientPlayer: string;
    editor: string;
  };
  errors?: string[];
  warnings?: string[];
  duration: number;
  cached?: boolean;
}
