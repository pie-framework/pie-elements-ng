/**
 * Pie-lib sync strategy - syncs @pie-lib packages from upstream pie-lib
 *
 * Synced from: pie-lib/packages/{package}/src/
 * Target: packages/lib-react/{package}/src/
 */

import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getCurrentCommit } from '../../utils/git.js';
import type { SyncStrategy, SyncContext, SyncConfig, SyncResult } from './sync-strategy.js';
import { cleanDirectory, readdir } from './sync-filesystem.js';
import { generatePieLibViteConfig } from './sync-vite-config.js';
import { createPieLibTransformPipeline } from './sync-transforms.js';
import { ensurePieLibPackageJson } from './sync-package-manager.js';
import { EXCLUDED_UPSTREAM_PIE_LIB_PACKAGES } from './sync-constants.js';
import { syncSourceTree } from './sync-source-tree.js';
import {
  getPieLibSourcePreserveList,
  getPieLibSyncMode,
  PIE_LIB_COMPATIBILITY_APPEND_PATCHES,
  shouldGenerateConfigUiFractionHelper,
  shouldGenerateAutosizeInputComponent,
} from './sync-presets.js';

interface InternalSyncResult {
  filesChecked: number;
  filesCopied: number;
  filesSkipped: number;
  filesUpdated: number;
}

export class PieLibStrategy implements SyncStrategy {
  private touchedPieLibPackages = new Set<string>();
  private result: InternalSyncResult = {
    filesChecked: 0,
    filesCopied: 0,
    filesSkipped: 0,
    filesUpdated: 0,
  };

  getName(): string {
    return 'pie-lib';
  }

  getDescription(): string {
    return '@pie-lib packages';
  }

  shouldRun(config: SyncConfig): boolean {
    return config.syncPieLib;
  }

  async execute(context: SyncContext): Promise<SyncResult> {
    const { config, logger } = context;
    this.touchedPieLibPackages.clear();
    this.result = {
      filesChecked: 0,
      filesCopied: 0,
      filesSkipped: 0,
      filesUpdated: 0,
    };

    if (!logger.isVerbose()) {
      logger.progressStart('Syncing @pie-lib packages...');
    } else {
      logger.section('📚 Syncing @pie-lib packages');
    }

    const upstreamLibDir = join(config.pieLib, 'packages');
    const targetBaseDir = join(config.pieElementsNg, 'packages/lib-react');

    // Verify pie-lib exists
    if (!existsSync(upstreamLibDir)) {
      logger.error(`pie-lib packages not found at ${upstreamLibDir}`);
      return { count: 0, packageNames: [] };
    }

    const upstreamCommit = getCurrentCommit(config.pieLib);

    // Get list of packages to sync
    const allPackages = await readdir(upstreamLibDir);
    let packagesToSync: string[];

    if (logger.isVerbose()) {
      logger.info(`   Compat report present: ${!!context.compatibilityReport}`);
      logger.info(
        `   Compat pieLibPackages: ${context.compatibilityReport?.pieLibPackages?.length || 0}`
      );
    }

    // Use the filtered list from config if available (computed from element dependencies)
    // This ensures we only sync the pie-lib packages actually needed by the elements being synced
    if (config.pieLibPackages && config.pieLibPackages.length > 0) {
      packagesToSync = config.pieLibPackages;
      if (logger.isVerbose()) {
        logger.info(`   Using filtered pie-lib list: ${packagesToSync.length} packages`);
        logger.info(`   Packages: ${packagesToSync.join(', ')}`);
      }
    } else if (context.compatibilityReport?.pieLibPackages?.length) {
      // Fallback to compatibility report list (used when no filtering is needed)
      packagesToSync = context.compatibilityReport.pieLibPackages;
      if (logger.isVerbose()) {
        logger.info(`   Using ESM compatibility report list: ${packagesToSync.length} packages`);
        logger.info(`   Packages: ${packagesToSync.join(', ')}`);
      }
    } else {
      // Final fallback: sync all packages
      packagesToSync = allPackages;
      if (logger.isVerbose()) {
        logger.info(`   Using all packages fallback: ${allPackages.length} packages`);
      }
    }

    for (const pkg of packagesToSync) {
      if (
        EXCLUDED_UPSTREAM_PIE_LIB_PACKAGES.includes(
          pkg as (typeof EXCLUDED_UPSTREAM_PIE_LIB_PACKAGES)[number]
        )
      ) {
        if (logger.isVerbose()) {
          logger.info(`  ⏭️  ${pkg}: skipping (locally owned package)`);
        }
        continue;
      }

      // Skip if package doesn't exist
      const pkgSrcDir = join(upstreamLibDir, pkg, 'src');
      if (!existsSync(pkgSrcDir)) {
        continue;
      }

      // Target: packages/lib-react/{package}/src/
      const targetDir = join(targetBaseDir, pkg);
      const targetSrcDir = join(targetDir, 'src');

      // Clean target src subtree first so removed upstream files don't linger
      await this.cleanTargetDir(targetSrcDir, pkg, `lib-react/${pkg}/src`, logger, config.dryRun);

      // Package sync mode is preset-driven (full sync vs wrapper generation).
      let filesProcessed: number;
      let libChanged: boolean;

      if (getPieLibSyncMode(pkg) === 'wrapper') {
        filesProcessed = await this.generateMathRenderingWrapper(targetSrcDir, logger);
        libChanged = filesProcessed > 0;
      } else {
        // Recursively sync all files from src/ directory
        const beforeChanges = this.result.filesCopied + this.result.filesUpdated;
        filesProcessed = await this.syncDirectory(
          pkgSrcDir,
          targetSrcDir,
          'src',
          pkg,
          upstreamCommit
        );
        const afterChanges = this.result.filesCopied + this.result.filesUpdated;
        libChanged = afterChanges > beforeChanges;
      }

      if (filesProcessed > 0 && logger.isVerbose()) {
        logger.success(`  ✨ ${pkg}: ${filesProcessed} file(s) synced`);
      }

      // Keep local compatibility exports that upstream plot package currently misses.
      const wroteCompatibilityPatch = await this.ensurePlotTypesCompatibilityPatch(
        pkg,
        targetSrcDir
      );
      const wroteAutosizeInput = await this.ensureAutosizeInputComponent(pkg, targetSrcDir);
      const wroteConfigUiFractionHelper = await this.ensureConfigUiFractionHelper(
        pkg,
        targetSrcDir
      );

      // Ensure package.json has ESM module support and expected exports
      let wrotePkgJson = false;
      wrotePkgJson = await ensurePieLibPackageJson(pkg, targetDir, config);

      // Ensure vite.config.ts exists
      const wroteViteConfig = await this.ensureViteConfig(pkg, targetDir, logger);

      // Ensure tsconfig.json exists
      const wroteTsConfig = await this.ensureTsConfig(pkg, targetDir, logger);

      if (
        libChanged ||
        wroteCompatibilityPatch ||
        wroteAutosizeInput ||
        wroteConfigUiFractionHelper ||
        wrotePkgJson ||
        wroteViteConfig ||
        wroteTsConfig
      ) {
        this.touchedPieLibPackages.add(pkg);
      }
    }

    if (!logger.isVerbose()) {
      logger.progressCompleteWithCount(this.touchedPieLibPackages.size, 'packages');
    } else {
      logger.info(`\nSynced ${this.touchedPieLibPackages.size} @pie-lib package(s)`);
    }
    return {
      count: this.touchedPieLibPackages.size,
      packageNames: Array.from(this.touchedPieLibPackages)
        .sort()
        .map((pkg) => `@pie-lib/${pkg}`),
    };
  }

  private async cleanTargetDir(
    targetDir: string,
    pkgName: string,
    label: string,
    logger: any,
    dryRun: boolean
  ): Promise<void> {
    const preserve = getPieLibSourcePreserveList(pkgName);

    await cleanDirectory(targetDir, label, { dryRun, verbose: false, preserve }, logger);
  }

  private async syncDirectory(
    sourceDir: string,
    targetDir: string,
    relativePath: string,
    pkg: string,
    upstreamCommit: string
  ): Promise<number> {
    const transformPipeline = createPieLibTransformPipeline();
    const stats = await syncSourceTree({
      sourceDir,
      targetDir,
      relativePath,
      sourcePathPrefix: `pie-lib/packages/${pkg}`,
      upstreamCommit,
      transform: (content, context) => transformPipeline(content, context.absoluteSourcePath),
    });

    this.result.filesChecked += stats.filesChecked;
    this.result.filesCopied += stats.filesCopied;
    this.result.filesSkipped += stats.filesSkipped;
    this.result.filesUpdated += stats.filesUpdated;

    return stats.filesProcessed;
  }

  /**
   * Generate a thin wrapper for math-rendering that re-exports from @pie-element/math-rendering
   */
  private async generateMathRenderingWrapper(targetSrcDir: string, logger: any): Promise<number> {
    await mkdir(targetSrcDir, { recursive: true });

    const wrapperContent = `// @ts-nocheck
/**
 * @synced-from pie-lib/packages/math-rendering
 * @auto-generated
 *
 * This is a thin wrapper that re-exports from @pie-element/shared-math-rendering-mathjax.
 * The actual implementation is in packages/shared/math-rendering-mathjax.
 */

export { renderMath, wrapMath, unWrapMath, mmlToLatex } from '@pie-element/shared-math-rendering-mathjax';
`;

    const indexPath = join(targetSrcDir, 'index.ts');
    const needsWrite =
      !existsSync(indexPath) || (await readFile(indexPath, 'utf-8')) !== wrapperContent;

    if (needsWrite) {
      await writeFile(indexPath, wrapperContent, 'utf-8');
      if (logger.isVerbose()) {
        logger.success(`  ✨ math-rendering: generated wrapper`);
      }
      return 1;
    }

    return 0;
  }

  private async ensureViteConfig(pkgName: string, pkgDir: string, logger: any): Promise<boolean> {
    if (!existsSync(pkgDir)) {
      return false;
    }

    const viteConfigPath = join(pkgDir, 'vite.config.ts');
    const viteConfig = generatePieLibViteConfig(pkgName, pkgDir);

    // Check if vite config needs to be written
    const currentContent = existsSync(viteConfigPath)
      ? await readFile(viteConfigPath, 'utf-8').catch(() => null)
      : null;

    if (currentContent === viteConfig) {
      return false;
    }

    await writeFile(viteConfigPath, viteConfig, 'utf-8');
    if (logger.isVerbose()) {
      logger.success(`  📝 ${pkgName}: generated vite.config.ts`);
    }
    return true;
  }

  private async ensurePlotTypesCompatibilityPatch(
    pkgName: string,
    targetSrcDir: string
  ): Promise<boolean> {
    const patchPreset = PIE_LIB_COMPATIBILITY_APPEND_PATCHES[pkgName];
    if (!patchPreset) {
      return false;
    }

    const typesPath = join(targetSrcDir, 'types.ts');
    if (!existsSync(typesPath)) {
      return false;
    }

    const current = await readFile(typesPath, 'utf-8');
    if (current.includes(patchPreset.requiredMarker)) {
      return false;
    }

    await writeFile(typesPath, `${current}${patchPreset.append}`, 'utf-8');
    return true;
  }

  private async ensureAutosizeInputComponent(
    pkgName: string,
    targetSrcDir: string
  ): Promise<boolean> {
    if (!shouldGenerateAutosizeInputComponent(pkgName)) {
      return false;
    }

    const autosizeInputPath = join(targetSrcDir, 'autosize-input.tsx');
    const content = `// @auto-generated by upstream:sync
// Local ESM replacement for react-input-autosize used by graph label inputs.
import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';

export interface AutosizeInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className' | 'style'> {
  className?: string;
  inputClassName?: string;
  inputRef?: (node: HTMLInputElement | null) => void;
  inputStyle?: React.CSSProperties;
  minWidth?: number | string;
  style?: React.CSSProperties;
}

const parsePixelValue = (value: string): number => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const readMinWidth = (
  value: number | string | undefined,
  fallback: number | string | undefined
): number => {
  const candidate = value ?? fallback;
  if (typeof candidate === 'number') {
    return candidate;
  }
  if (typeof candidate === 'string' && candidate.endsWith('px')) {
    return parsePixelValue(candidate);
  }
  return 1;
};

export const AutosizeInput = React.forwardRef<HTMLInputElement, AutosizeInputProps>(
  (
    {
      className,
      inputClassName,
      inputRef,
      inputStyle,
      minWidth,
      placeholder,
      style,
      value,
      defaultValue,
      ...inputProps
    },
    forwardedRef
  ) => {
    const inputNodeRef = useRef<HTMLInputElement | null>(null);
    const inputRefCallbackRef = useRef(inputRef);
    const forwardedRefRef = useRef(forwardedRef);
    const measureNodeRef = useRef<HTMLSpanElement | null>(null);
    const [width, setWidth] = useState(() => readMinWidth(minWidth, inputStyle?.minWidth));

    inputRefCallbackRef.current = inputRef;
    forwardedRefRef.current = forwardedRef;

    const setInputRef = useCallback(
      (node: HTMLInputElement | null) => {
        inputNodeRef.current = node;
        inputRefCallbackRef.current?.(node);
        const currentForwardedRef = forwardedRefRef.current;
        if (typeof currentForwardedRef === 'function') {
          currentForwardedRef(node);
        } else if (currentForwardedRef) {
          (currentForwardedRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
        }
      },
      []
    );

    useLayoutEffect(() => {
      const input = inputNodeRef.current;
      const measure = measureNodeRef.current;
      if (!input || !measure) {
        return;
      }

      const computed = window.getComputedStyle(input);
      measure.style.font = computed.font;
      measure.style.letterSpacing = computed.letterSpacing;
      measure.style.textTransform = computed.textTransform;
      measure.textContent = String(value ?? defaultValue ?? placeholder ?? '') || ' ';

      const horizontalPadding =
        parsePixelValue(computed.paddingLeft) +
        parsePixelValue(computed.paddingRight) +
        parsePixelValue(computed.borderLeftWidth) +
        parsePixelValue(computed.borderRightWidth);
      const measuredTextWidth = Math.ceil(measure.getBoundingClientRect().width + 2);
      const measuredWidth =
        computed.boxSizing === 'border-box'
          ? measuredTextWidth + horizontalPadding
          : measuredTextWidth;
      setWidth(Math.max(readMinWidth(minWidth, inputStyle?.minWidth), measuredWidth));
    }, [defaultValue, inputClassName, inputStyle, minWidth, placeholder, value]);

    return (
      <span className={className} style={{ display: 'inline-block', ...style }}>
        <input
          {...inputProps}
          ref={setInputRef}
          className={inputClassName}
          placeholder={placeholder}
          style={{ width, ...inputStyle }}
          value={value}
          defaultValue={defaultValue}
        />
        <span
          ref={measureNodeRef}
          aria-hidden="true"
          style={{
            height: 0,
            left: 0,
            overflow: 'hidden',
            position: 'absolute',
            top: 0,
            visibility: 'hidden',
            whiteSpace: 'pre',
          }}
        />
      </span>
    );
  }
);

AutosizeInput.displayName = 'AutosizeInput';
`;

    const current = existsSync(autosizeInputPath)
      ? await readFile(autosizeInputPath, 'utf-8').catch(() => null)
      : null;
    if (current === content) {
      return false;
    }

    await writeFile(autosizeInputPath, content, 'utf-8');
    return true;
  }

  private async ensureConfigUiFractionHelper(
    pkgName: string,
    targetSrcDir: string
  ): Promise<boolean> {
    if (!shouldGenerateConfigUiFractionHelper(pkgName)) {
      return false;
    }

    const helperPath = join(targetSrcDir, 'fraction-to-number.ts');
    const content = `// @auto-generated by upstream:sync
// Local ESM replacement for config-ui's tiny mathjs fraction conversion usage.
type FractionLike = {
  d: number;
  n: number;
  s?: number;
};

const isFractionLike = (value: unknown): value is FractionLike =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as FractionLike).n === 'number' &&
  typeof (value as FractionLike).d === 'number';

export const fractionToNumber = (value: FractionLike | number | string): number => {
  if (typeof value === 'number') {
    return value;
  }

  if (isFractionLike(value)) {
    const sign = value.s ?? 1;
    return (sign * value.n) / value.d;
  }

  const normalized = String(value).trim();
  const fractionMatch = normalized.match(/^([+-]?\\d+)\\s*\\/\\s*([+-]?\\d+)$/);
  if (fractionMatch) {
    const numerator = Number.parseInt(fractionMatch[1] ?? '0', 10);
    const denominator = Number.parseInt(fractionMatch[2] ?? '1', 10);
    return numerator / denominator;
  }

  return Number(normalized);
};
`;

    const current = existsSync(helperPath)
      ? await readFile(helperPath, 'utf-8').catch(() => null)
      : null;
    if (current === content) {
      return false;
    }

    await writeFile(helperPath, content, 'utf-8');
    return true;
  }

  private async ensureTsConfig(pkgName: string, pkgDir: string, logger: any): Promise<boolean> {
    if (!existsSync(pkgDir)) {
      return false;
    }

    const tsConfigPath = join(pkgDir, 'tsconfig.json');
    const tsConfig = this.generateTsConfig();

    // Check if tsconfig needs to be written
    const currentContent = existsSync(tsConfigPath)
      ? await readFile(tsConfigPath, 'utf-8').catch(() => null)
      : null;

    if (currentContent === tsConfig) {
      return false;
    }

    await writeFile(tsConfigPath, tsConfig, 'utf-8');
    if (logger.isVerbose()) {
      logger.success(`  📝 ${pkgName}: generated tsconfig.json`);
    }
    return true;
  }

  private generateTsConfig(): string {
    return `{
  "extends": "../../../tsconfig.declarations.json",
  "compilerOptions": {
    "outDir": "dist",
    "declarationDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*"]
}
`;
  }
}
