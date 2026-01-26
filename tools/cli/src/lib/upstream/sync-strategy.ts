/**
 * Strategy pattern for sync operations
 */
import type { Logger } from '../../utils/logger.js';
import type { CompatibilityReport } from '../../utils/compatibility.js';

export interface SyncConfig {
  pieElements: string;
  pieLib: string;
  pieElementsNg: string;

  // What to sync
  syncControllers: boolean;
  syncReactComponents: boolean;
  syncPieLib: boolean;

  // Options
  skipDemos: boolean;
  upstreamCommit: string;
}

export interface SyncContext {
  config: SyncConfig;
  logger: Logger;
  packageFilter?: string;
  compatibilityReport?: CompatibilityReport;
}

export interface SyncResult {
  count: number;
  packageNames: string[];
}

/**
 * Base interface for sync strategies
 */
export interface SyncStrategy {
  /**
   * Get the name of this strategy
   */
  getName(): string;

  /**
   * Check if this strategy should run based on config
   */
  shouldRun(config: SyncConfig): boolean;

  /**
   * Execute the sync operation
   * @returns Sync result with count and package names
   */
  execute(context: SyncContext): Promise<SyncResult>;

  /**
   * Get a human-readable description of what this strategy syncs
   */
  getDescription(): string;
}
