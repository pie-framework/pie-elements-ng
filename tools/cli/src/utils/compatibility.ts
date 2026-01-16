import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

/**
 * ESM package.json validation result
 */
export interface EsmPackageValidation {
  hasTypeModule: boolean;
  hasExportsField: boolean;
  hasMainExport: boolean;
  hasControllerExport: boolean;
  sideEffectsFree: boolean;
  mainExportIsEsm: boolean;
  controllerExportIsEsm: boolean;
}

/**
 * ESM player validation result for an element
 */
export interface EsmValidationResult {
  compatible: boolean;
  packageJson: EsmPackageValidation;
  blockers: string[];
  warnings: string[];
}

/**
 * Runtime-ish validation for ESM player readiness (CDN resolution / module parse).
 * Note: this is NOT a full browser execution test, but it provides production-like signal
 * by verifying CDN URLs resolve and the returned JS parses as an ES module.
 */
export interface EsmRuntimeValidationResult {
  /**
   * Whether this element passed the runtime-ish probe.
   * When false, see `errors` for details.
   */
  compatible: boolean;
  /** The CDN base URL used for probing (e.g. https://esm.sh). */
  cdnBaseUrl: string;
  /** Version that was probed (usually the upstream package.json version). */
  version: string;
  /** Whether the package entrypoint URL resolved (HTTP 200). */
  entryOk: boolean;
  /** Whether the controller URL resolved (HTTP 200). */
  controllerOk: boolean;
  /** Whether the returned JS for the entry parsed as an ES module. */
  entryParseOk: boolean;
  /** Whether the returned JS for the controller parsed as an ES module. */
  controllerParseOk: boolean;
  /** Any errors/warnings collected during probe. */
  errors: string[];

  /**
   * Probe details (for deep/transitive validation)
   */
  probeMode?: 'shallow' | 'deep';
  maxDepth?: number;
  maxModules?: number;
  fetchedModules?: number;
  fetchedOk?: number;
  firstFailingUrl?: string;
}

/**
 * Compatibility report structure
 */
export interface CompatibilityReport {
  elements: string[];
  pieLibPackages: string[];
  blockedElements: Record<string, string[]>;
  elementDetails: Record<string, ElementDetail>;
  pieLibDetails: Record<string, PieLibDetail>;

  // ESM player validation
  esmPlayerReady: string[];
  esmValidation: Record<string, EsmValidationResult>;
  /**
   * Whether ESM player validation (package.json structure / exports) was run as part of analysis.
   * Optional for backwards compatibility with older reports.
   */
  esmPlayerValidationEnabled?: boolean;

  // Runtime-ish validation (CDN probes)
  esmRuntimeValidationEnabled?: boolean;
  esmRuntimeCdnBaseUrl?: string;
  esmRuntimeValidation?: Record<string, EsmRuntimeValidationResult>;

  // Student UI only (elements where student UI is ESM-ready but authoring isn't)
  studentUIOnly?: string[];

  lastAnalyzed: string;
  summary: {
    totalElements: number;
    compatibleElements: number;
    blockedElements: number;
    studentUIOnlyElements?: number;
    esmPlayerReady: number;
    esmRuntimeReady?: number;
    totalPieLibPackages: number;
    compatiblePieLibPackages: number;
  };
}

export interface ElementDetail {
  compatible: boolean;
  directDeps: string[];
  pieLibDeps: string[];
  pieElementDeps: string[];
  blockers: string[];

  // Separate analysis for student UI vs authoring
  studentUI?: {
    compatible: boolean;
    blockers: string[];
  };
  configure?: {
    compatible: boolean;
    blockers: string[];
  };
  controller?: {
    compatible: boolean;
    blockers: string[];
  };
}

export interface PieLibDetail {
  compatible: boolean;
  usedBy: string[];
  blockers: string[];
}

export async function loadCompatibilityReport(path: string): Promise<CompatibilityReport> {
  if (!existsSync(path)) {
    throw new Error(`Compatibility report not found at: ${path}`);
  }

  const content = await readFile(path, 'utf-8');
  return JSON.parse(content) as CompatibilityReport;
}

export function isElementCompatible(element: string, report: CompatibilityReport): boolean {
  return report.elements.includes(element);
}

export function isPieLibPackageCompatible(pkg: string, report: CompatibilityReport): boolean {
  return report.pieLibPackages.includes(pkg);
}

export function getElementBlockers(element: string, report: CompatibilityReport): string[] {
  return report.blockedElements[element] || [];
}

/**
 * Check if an element is ESM player ready (no CommonJS deps + proper ESM package structure)
 */
export function isElementEsmPlayerReady(element: string, report: CompatibilityReport): boolean {
  return report.esmPlayerReady.includes(element);
}

/**
 * Check if an element has student UI ready (even if configure/controller aren't)
 */
export function isElementStudentUIReady(element: string, report: CompatibilityReport): boolean {
  const detail = report.elementDetails[element];
  if (!detail) return false;

  // If fully compatible, student UI is ready
  if (detail.compatible) return true;

  // Check if student UI is explicitly marked as compatible
  return detail.studentUI?.compatible === true;
}

/**
 * Get ESM validation details for an element
 */
export function getEsmValidation(
  element: string,
  report: CompatibilityReport
): EsmValidationResult | null {
  return report.esmValidation[element] || null;
}
