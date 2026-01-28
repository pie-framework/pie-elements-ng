/**
 * Compatibility checking utilities for upstream sync operations
 *
 * Consolidates subdirectory-level ESM compatibility checks that were
 * duplicated across controllers-strategy and react-strategy.
 */

import type { SyncContext } from './sync-strategy.js';

export type SubdirectoryType = 'src' | 'configure' | 'controller';

/**
 * Check if a subdirectory is ESM-compatible based on the compatibility report
 *
 * This function consolidates the duplicated compatibility checking logic from
 * ControllersStrategy and ReactComponentsStrategy.
 *
 * @param elementName - Name of the element (e.g., "multiple-choice")
 * @param subdir - Subdirectory to check ("src", "configure", or "controller")
 * @param context - Sync context containing the compatibility report
 * @returns true if compatible or no report available, false if incompatible
 */
export function isSubdirectoryCompatible(
  elementName: string,
  subdir: SubdirectoryType,
  context: SyncContext
): boolean {
  // If no compatibility report, assume compatible (backward compatibility)
  if (!context.compatibilityReport) {
    return true;
  }

  const elementDetail = context.compatibilityReport.elementDetails[elementName];
  if (!elementDetail) {
    return true; // Element not in report, assume compatible
  }

  // Check subdirectory-specific compatibility
  switch (subdir) {
    case 'configure':
      return elementDetail.configure?.compatible ?? elementDetail.compatible;
    case 'controller':
      return elementDetail.controller?.compatible ?? elementDetail.compatible;
    case 'src':
      return elementDetail.studentUI?.compatible ?? elementDetail.compatible;
    default:
      return elementDetail.compatible;
  }
}

/**
 * Check if an element is ESM-compatible overall
 */
export function isElementCompatible(elementName: string, context: SyncContext): boolean {
  if (!context.compatibilityReport) {
    return true;
  }

  return context.compatibilityReport.elements.includes(elementName);
}

/**
 * Get compatibility blockers for an element subdirectory
 */
export function getCompatibilityBlockers(
  elementName: string,
  subdir: SubdirectoryType,
  context: SyncContext
): string[] {
  if (!context.compatibilityReport) {
    return [];
  }

  const elementDetail = context.compatibilityReport.elementDetails[elementName];
  if (!elementDetail) {
    return [];
  }

  switch (subdir) {
    case 'configure':
      return elementDetail.configure?.blockers ?? [];
    case 'controller':
      return elementDetail.controller?.blockers ?? [];
    case 'src':
      return elementDetail.studentUI?.blockers ?? [];
    default:
      return [];
  }
}
