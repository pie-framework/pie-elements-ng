/**
 * Core types for PIE bundler
 * Compatible with pie-api-aws interface
 */

export interface BuildDependency {
  name: string; // @pie-element/multiple-choice
  version: string; // 12.0.0
}

export type BuildResolutionMode = 'workspace-fast' | 'prod-faithful';
export type BuildBundleName = 'player' | 'client-player' | 'editor';

export type BuildStage =
  | 'queued'
  | 'installing'
  | 'generating_entries'
  | 'bundling'
  | 'bundling_controllers'
  | 'completed'
  | 'failed';

export interface BuildOptions {
  buildId?: string;
  resolutionMode?: BuildResolutionMode;
  workspaceRoot?: string;
  requestedBundles?: BuildBundleName[];
  /** Emit source maps for local debugging (larger/slower bundles). */
  sourceMaps?: boolean;
  /**
   * When true, also emit standalone controller artifacts compatible with
   * pie-api-aws `/controllers/<dep>_at_<version>/controller.js` layout.
   */
  includeControllers?: boolean;
}

export interface BuildRequest {
  dependencies: BuildDependency[];
  options?: BuildOptions;
}

export interface BuildProgressEvent {
  buildId: string;
  hash: string;
  stage: BuildStage;
  timestamp: number;
  message?: string;
}

export type BuildProgressListener = (event: BuildProgressEvent) => void;

export interface BuildResult {
  success: boolean;
  hash: string;
  bundles?: Partial<Record<'player' | 'clientPlayer' | 'editor', string>>;
  controllers?: Record<string, string>;
  errors?: string[];
  warnings?: string[];
  duration: number;
  cached?: boolean;
}
