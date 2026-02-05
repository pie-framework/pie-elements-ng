/**
 * Centralized transformation pipeline for upstream sync operations
 *
 * This module consolidates all source code transformations into a single,
 * composable pipeline to reduce duplication and ensure consistent transformations
 * across all sync strategies.
 */

import {
  transformLodashToLodashEs,
  transformPieFrameworkEventImports,
  transformControllerUtilsImports,
  transformSharedPackageImports,
  transformMathquillImports,
  inlineEditableHtmlConstants,
  reexportTokenTypes,
  transformSsrRequireToReactLazy,
  inlineConfigureDefaults,
  transformConfigureUtilsImports,
  transformSelfReferentialImports,
  transformPackageJsonLodash,
  transformPackageJsonRecharts,
  transformPackageJsonPieEvents,
  transformPackageJsonControllerUtils,
  transformPackageJsonSharedPackages,
  transformPackageJsonMathquill,
  fixStyledComponentTypes,
  fixExportedFunctionTypes,
  transformMenuToInlineMenu,
  addInlineMenuExport,
  transformMathQuillInterface,
} from './sync-imports.js';
import type { PackageJson } from '../../utils/package-json.js';

export interface TransformOptions {
  /** Path relative to package root (e.g., "configure/src/utils.js") */
  relativePath?: string;
  /** Source file path for context (e.g., "/path/to/file.js") */
  sourcePath?: string;
  /** Package name (e.g., "@pie-element/fraction-model") */
  packageName?: string;
  /** Whether to include configure-specific transforms */
  includeConfigure?: boolean;
  /** Whether to include pie-lib-specific transforms */
  includePieLib?: boolean;
}

/**
 * Apply all standard source code transformations in the correct order
 *
 * This ensures consistent transformation across all sync strategies:
 * 1. lodash → lodash-es (ESM compatibility)
 * 2. @pie-framework event packages → internal packages
 * 3. @pie-lib/controller-utils → @pie-framework/controller-utils
 * 4. @pie-lib shared packages → @pie-element/shared-*
 * 5. @pie-framework/mathquill → @pie-element/shared-mathquill
 * 6. @mui/material/Menu → InlineMenu from @pie-lib/render-ui
 * 7. Self-referential imports → relative imports
 * 8. Configure-specific transforms (if enabled)
 * 9. Pie-lib-specific transforms (if enabled)
 * 10. Fix styled component TypeScript type inference errors
 */
export function applySourceTransforms(content: string, options: TransformOptions = {}): string {
  let transformed = content;

  // Core transforms (always applied)
  transformed = transformLodashToLodashEs(transformed);
  transformed = transformPieFrameworkEventImports(transformed);
  transformed = transformControllerUtilsImports(transformed);
  transformed = transformSharedPackageImports(transformed);
  transformed = transformMathquillImports(transformed);
  transformed = transformMathQuillInterface(transformed);
  transformed = transformMenuToInlineMenu(transformed);

  // Transform self-referential imports to relative paths
  if (options.packageName && options.relativePath) {
    transformed = transformSelfReferentialImports(
      transformed,
      options.packageName,
      options.relativePath
    );
  }

  // Configure-specific transforms
  if (options.includeConfigure) {
    transformed = inlineConfigureDefaults(transformed);
    if (options.relativePath) {
      transformed = transformConfigureUtilsImports(transformed, options.relativePath);
    }
  }

  // Pie-lib-specific transforms
  if (options.includePieLib) {
    transformed = inlineEditableHtmlConstants(transformed);
    if (options.sourcePath) {
      transformed = reexportTokenTypes(transformed, options.sourcePath);
      transformed = addInlineMenuExport(transformed, options.sourcePath);
    }
    transformed = transformSsrRequireToReactLazy(transformed);
  }

  // TypeScript fixes (always applied)
  transformed = fixStyledComponentTypes(transformed);
  transformed = fixExportedFunctionTypes(transformed, options.sourcePath);

  return transformed;
}

/**
 * Apply all standard package.json transformations
 *
 * Ensures consistent dependency transformations across all packages:
 * 1. lodash → lodash-es
 * 2. @pie-framework event packages → internal packages
 * 3. @pie-lib/controller-utils → @pie-framework/controller-utils
 * 4. @pie-lib shared packages → @pie-element/shared-*
 * 5. @pie-framework/mathquill → @pie-element/shared-mathquill
 */
export function applyPackageJsonTransforms<T extends PackageJson>(pkg: T): T {
  let transformed = pkg;

  transformed = transformPackageJsonLodash(transformed);
  transformed = transformPackageJsonRecharts(transformed);
  transformed = transformPackageJsonPieEvents(transformed);
  transformed = transformPackageJsonControllerUtils(transformed);
  transformed = transformPackageJsonSharedPackages(transformed);
  transformed = transformPackageJsonMathquill(transformed);

  return transformed;
}

/**
 * Create a transform pipeline for controller files
 */
export function createControllerTransformPipeline(packageName?: string) {
  return (content: string, relativePath?: string) =>
    applySourceTransforms(content, { relativePath, packageName, includeConfigure: false });
}

/**
 * Create a transform pipeline for React component files
 */
export function createReactComponentTransformPipeline(packageName?: string) {
  return (content: string, relativePath?: string) =>
    applySourceTransforms(content, { relativePath, packageName, includeConfigure: true });
}

/**
 * Create a transform pipeline for pie-lib files
 */
export function createPieLibTransformPipeline() {
  return (content: string, sourcePath?: string) =>
    applySourceTransforms(content, { sourcePath, includePieLib: true });
}
