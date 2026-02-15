/**
 * Summary utilities for sync operations
 */
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Logger } from '../../utils/logger.js';
import type { CompatibilityReport } from '../../utils/compatibility.js';
import { EXCLUDED_UPSTREAM_ELEMENTS } from './sync-constants.js';

export interface SyncSummary {
  controllersSync: number;
  reactComponentsSynced: number;
  pieLibPackagesSynced: number;
  totalPackagesSynced: number;
  blockedElements: number;
  blockedPieLib: number;
  syncedPackageNames: string[];
}

/**
 * Get all currently synced elements from packages/elements-react directory
 */
function getAllSyncedElements(pieElementsNgPath: string): string[] {
  try {
    const elementsReactPath = join(pieElementsNgPath, 'packages', 'elements-react');
    const entries = readdirSync(elementsReactPath, { withFileTypes: true });
    return entries
      .filter((entry) => {
        if (!entry.isDirectory() || entry.name.startsWith('.')) {
          return false;
        }
        if (
          EXCLUDED_UPSTREAM_ELEMENTS.includes(
            entry.name as (typeof EXCLUDED_UPSTREAM_ELEMENTS)[number]
          )
        ) {
          return false;
        }
        return existsSync(join(elementsReactPath, entry.name, 'package.json'));
      })
      .map((entry) => entry.name)
      .sort();
  } catch (error) {
    return [];
  }
}

/**
 * Print a concise summary of the sync operation
 */
export function printSyncSummary(
  summary: SyncSummary,
  compatibilityReport: CompatibilityReport | null,
  pieElementsNgPath: string,
  logger: Logger
): void {
  logger.info('');
  logger.info('─'.repeat(60));
  logger.info('');

  // Show changes from this sync run
  if (summary.syncedPackageNames.length > 0) {
    const elementCount = summary.syncedPackageNames.length;
    logger.success(`${elementCount} element${elementCount > 1 ? 's' : ''} synced in this run`);
    for (const pkg of summary.syncedPackageNames.sort()) {
      logger.info(`  • ${pkg}`);
    }
    logger.info('');
  }

  // Show complete overview of all synced and blocked elements
  logger.info('Complete Overview:');
  logger.info('');

  // All currently synced elements
  const allSyncedElements = getAllSyncedElements(pieElementsNgPath);
  if (allSyncedElements.length > 0) {
    logger.success(`${allSyncedElements.length} elements currently synced`);
    for (const element of allSyncedElements) {
      logger.info(`  • ${element}`);
    }
  } else {
    logger.info('No elements synced');
  }

  const totalBlocked = summary.blockedElements + summary.blockedPieLib;
  if (totalBlocked > 0 && compatibilityReport) {
    logger.info('');
    logger.warn(`${totalBlocked} packages blocked from sync (ESM incompatible)`);

    // List blocked elements
    const blockedElementNames = Object.keys(compatibilityReport.blockedElements).sort();
    if (blockedElementNames.length > 0) {
      logger.info('');
      logger.info('Blocked elements:');
      for (const element of blockedElementNames) {
        const blockers = compatibilityReport.blockedElements[element];
        const firstBlocker = blockers[0] || 'Unknown blocker';
        logger.info(`  • ${element}: ${firstBlocker}`);
      }
    }

    // List blocked pie-lib packages
    const blockedPieLibNames = Object.entries(compatibilityReport.pieLibDetails)
      .filter(([, details]) => !details.compatible)
      .map(([pkg]) => pkg)
      .sort();

    if (blockedPieLibNames.length > 0) {
      logger.info('');
      logger.info('Blocked @pie-lib packages:');
      for (const pkg of blockedPieLibNames) {
        const details = compatibilityReport.pieLibDetails[pkg];
        const firstBlocker = details.blockers[0] || 'Unknown blocker';
        logger.info(`  • @pie-lib/${pkg}: ${firstBlocker}`);
      }
    }

    // Show summary of blocker types
    if (logger.isVerbose()) {
      logger.info('');
      logger.info('Blocker summary by type:');

      // Group blockers by type
      const blockersByType = new Map<string, string[]>();

      // Analyze element blockers
      for (const [element, blockers] of Object.entries(compatibilityReport.blockedElements)) {
        for (const blocker of blockers) {
          const match = blocker.match(/^(.+?)\s*-\s*(.+)$/);
          if (match) {
            const [, dep, reason] = match;
            const key = `${dep}: ${reason}`;
            if (!blockersByType.has(key)) {
              blockersByType.set(key, []);
            }
            const pkgList = blockersByType.get(key);
            if (pkgList) {
              pkgList.push(element);
            }
          }
        }
      }

      // Analyze pie-lib blockers
      for (const [pkg, details] of Object.entries(compatibilityReport.pieLibDetails)) {
        if (!details.compatible) {
          for (const blocker of details.blockers) {
            const match = blocker.match(/^(.+?)\s*-\s*(.+)$/);
            if (match) {
              const [, dep, reason] = match;
              const key = `${dep}: ${reason}`;
              if (!blockersByType.has(key)) {
                blockersByType.set(key, []);
              }
              const pkgList = blockersByType.get(key);
              if (pkgList) {
                pkgList.push(`@pie-lib/${pkg}`);
              }
            }
          }
        }
      }

      const sortedBlockers = Array.from(blockersByType.entries()).sort(
        (a, b) => b[1].length - a[1].length
      );

      for (const [blocker, packages] of sortedBlockers) {
        logger.info(`  • ${packages.length} package${packages.length > 1 ? 's' : ''}: ${blocker}`);
        for (const pkg of packages) {
          logger.info(`    - ${pkg}`);
        }
      }
    }
  }

  logger.info('');
}

/**
 * Create an empty summary
 */
export function createEmptySummary(): SyncSummary {
  return {
    controllersSync: 0,
    reactComponentsSynced: 0,
    pieLibPackagesSynced: 0,
    totalPackagesSynced: 0,
    blockedElements: 0,
    blockedPieLib: 0,
    syncedPackageNames: [],
  };
}
