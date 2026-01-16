import { Command, Flags } from '@oclif/core';
import { Logger } from '../../utils/logger.js';
import { loadPackageJson, type PackageJson } from '../../utils/package-json.js';
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type {
  CompatibilityReport,
  ElementDetail,
  EsmPackageValidation,
  EsmRuntimeValidationResult,
  EsmValidationResult,
} from '../../utils/compatibility.js';

// PIE elements that are actively used in pie-elements-ng
// Only these elements will be analyzed
const ACTIVE_ELEMENTS = [
  'categorize',
  'charting',
  'complex-rubric',
  'drag-in-the-blank',
  'drawing-response',
  'ebsr',
  'explicit-constructed-response',
  'extended-text-entry',
  'fraction-model',
  'graphing',
  'graphing-solution-set',
  'hotspot',
  'image-cloze-association',
  'inline-dropdown',
  'likert',
  'match',
  'match-list',
  'math-inline',
  'math-templated',
  'matrix',
  'multi-trait-rubric',
  'multiple-choice',
  'number-line',
  'passage',
  'placement-ordering',
  'rubric',
  'select-text',
];

// Known ESM blockers - packages that prevent ESM builds
const ESM_BLOCKERS = [
  // Old Slate editor (v0.36.x) - not ESM compatible
  { pattern: /^slate@0\.[0-4]\d/, reason: 'Slate v0.x is not ESM compatible' },
  { pattern: /^slate-/, reason: 'Slate v0.x plugins are not ESM compatible' },

  // Known CommonJS-only packages (add more as discovered)
  { pattern: /^enzyme/, reason: 'Enzyme is not ESM compatible' },
];

// PIE lib packages that should always be included if compatible
// These are packages that may be imported directly in code (e.g., controllers)
// but not declared in package.json dependencies
const ALWAYS_INCLUDE_PIE_LIB = [
  'controller-utils', // Used in controller code via direct imports
];

export default class AnalyzeEsm extends Command {
  static override description = 'Analyze PIE elements for ESM compatibility';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --verbose',
    '<%= config.bin %> <%= command.id %> --output=./.compatibility/custom-report.json',
  ];

  static override flags = {
    verbose: Flags.boolean({
      char: 'v',
      description: 'Show detailed analysis output',
      default: false,
    }),
    'pie-elements': Flags.string({
      description: 'Path to pie-elements repo',
      default: '../pie-elements',
    }),
    'pie-lib': Flags.string({
      description: 'Path to pie-lib repo',
      default: '../pie-lib',
    }),
    output: Flags.string({
      description: 'Output JSON file path',
      default: './.compatibility/report.json',
    }),
    'include-dev-deps': Flags.boolean({
      description:
        'Include devDependencies in blocker analysis (usually unnecessary since pie-elements-ng does not sync upstream tests)',
      default: false,
    }),
    'validate-esm-player': Flags.boolean({
      description: 'Validate ESM player compatibility (package.json structure, exports).',
      default: true,
      allowNo: true,
    }),
    'runtime-cdn-base-url': Flags.string({
      description: 'CDN base URL to use for runtime probes (e.g. https://esm.sh)',
      default: 'https://esm.sh',
    }),
    'runtime-local-pie-elements-path': Flags.string({
      description: 'Path to sibling pie-elements repo used for local PIE resolution during probes.',
      default: '../pie-elements',
    }),
    'runtime-local-pie-lib-path': Flags.string({
      description: 'Path to sibling pie-lib repo used for local PIE resolution during probes.',
      default: '../pie-lib',
    }),
    'runtime-timeout-ms': Flags.integer({
      description: 'Timeout for each runtime probe request (ms)',
      default: 6000,
    }),
    'runtime-concurrency': Flags.integer({
      description: 'Max concurrent runtime probes',
      default: 8,
    }),
    'runtime-max-depth': Flags.integer({
      description: 'Max import graph depth for the deep runtime probe',
      default: 6,
    }),
    'runtime-max-modules': Flags.integer({
      description: 'Max total modules fetched per element for the deep runtime probe',
      default: 250,
    }),
    'runtime-cache-file': Flags.string({
      description:
        'Optional JSON cache file path for runtime probe results (speeds up repeated runs)',
      default: './.cache/analyze-esm.runtime-cache.json',
    }),
  };

  private logger = new Logger();

  public async run(): Promise<void> {
    const { flags } = await this.parse(AnalyzeEsm);

    this.logger = new Logger(flags.verbose);

    if (flags.verbose) {
      this.logger.section('🔍 Analyzing ESM Compatibility');
      this.logger.info(`   PIE Elements: ${flags['pie-elements']}`);
      this.logger.info(`   PIE Lib:      ${flags['pie-lib']}\n`);
    }

    // Verify repos exist
    if (!existsSync(flags['pie-elements'])) {
      this.error(`pie-elements not found at ${flags['pie-elements']}`);
    }
    if (!existsSync(flags['pie-lib'])) {
      this.error(`pie-lib not found at ${flags['pie-lib']}`);
    }

    const report = await this.analyzeCompatibility(
      flags['pie-elements'],
      flags['pie-lib'],
      flags.verbose,
      flags['include-dev-deps'],
      flags['validate-esm-player'],
      flags['runtime-cdn-base-url'],
      flags['runtime-local-pie-elements-path'],
      flags['runtime-local-pie-lib-path'],
      flags['runtime-timeout-ms'],
      flags['runtime-concurrency'],
      flags['runtime-max-depth'],
      flags['runtime-max-modules'],
      flags['runtime-cache-file']
    );

    // Save JSON report
    const outputDir = join(flags.output, '..');
    await mkdir(outputDir, { recursive: true });
    await writeFile(flags.output, JSON.stringify(report, null, 2), 'utf-8');

    // Print summary
    this.printReport(report, flags.output);
  }

  private async analyzeCompatibility(
    pieElementsPath: string,
    pieLibPath: string,
    verbose: boolean,
    includeDevDeps: boolean,
    validateEsmPlayer: boolean,
    runtimeCdnBaseUrl: string,
    runtimeLocalPieElementsPath: string,
    runtimeLocalPieLibPath: string,
    runtimeTimeoutMs: number,
    runtimeConcurrency: number,
    runtimeMaxDepth: number,
    runtimeMaxModules: number,
    runtimeCacheFile: string
  ): Promise<CompatibilityReport> {
    if (!verbose) {
      this.logger.progressStart('Analyzing ESM compatibility...');
    }

    const report: CompatibilityReport = {
      elements: [],
      pieLibPackages: [],
      blockedElements: {},
      esmPlayerReady: [],
      esmValidation: {},
      esmPlayerValidationEnabled: validateEsmPlayer,
      esmRuntimeValidationEnabled: true,
      esmRuntimeCdnBaseUrl: runtimeCdnBaseUrl,
      esmRuntimeValidation: {},
      elementDetails: {},
      pieLibDetails: {},
      lastAnalyzed: new Date().toISOString(),
      summary: {
        totalElements: 0,
        compatibleElements: 0,
        blockedElements: 0,
        esmPlayerReady: 0,
        esmRuntimeReady: 0,
        totalPieLibPackages: 0,
        compatiblePieLibPackages: 0,
      },
    };

    // Cache for pie-lib compatibility checks
    const pieLibCache = new Map<
      string,
      {
        compatible: boolean;
        blockers: string[];
      }
    >();

    // Get all element packages
    const elementsDir = join(pieElementsPath, 'packages');
    const allElements = await readdir(elementsDir);

    // Filter to only active elements used in pie-elements-ng
    const elements = allElements.filter((name) => ACTIVE_ELEMENTS.includes(name));

    report.summary.totalElements = elements.length;

    if (verbose) {
      this.logger.info(`📊 Analyzing ${elements.length} elements...\n`);
    }

    // Track which elements use which pie-lib packages
    const pieLibUsage = new Map<string, Set<string>>();

    // Analyze each element
    for (const element of elements.sort()) {
      const result = await this.checkElementCompatibility(
        element,
        pieElementsPath,
        pieLibPath,
        pieLibCache,
        verbose,
        includeDevDeps
      );

      // Check subdirectories separately
      const srcCheck = await this.checkSubdirectoryCompatibility(
        element,
        'src',
        pieElementsPath,
        pieLibPath,
        pieLibCache,
        verbose,
        includeDevDeps
      );

      const configureCheck = await this.checkSubdirectoryCompatibility(
        element,
        'configure',
        pieElementsPath,
        pieLibPath,
        pieLibCache,
        verbose,
        includeDevDeps
      );

      const controllerCheck = await this.checkSubdirectoryCompatibility(
        element,
        'controller',
        pieElementsPath,
        pieLibPath,
        pieLibCache,
        verbose,
        includeDevDeps
      );

      // Add subdirectory results to element details
      if (srcCheck !== null) {
        result.studentUI = srcCheck;
      }
      if (configureCheck !== null) {
        result.configure = configureCheck;
      }
      if (controllerCheck !== null) {
        result.controller = controllerCheck;
      }

      report.elementDetails[element] = result;

      if (result.compatible) {
        report.elements.push(element);
        report.summary.compatibleElements++;

        // Track pie-lib usage (including transitive deps)
        // For example: if element uses text-select, and text-select uses style-utils,
        // we need to sync both text-select AND style-utils
        const allPieLibDeps = await this.collectAllTransitivePieLibDeps(
          result.pieLibDeps,
          pieLibPath,
          includeDevDeps
        );

        for (const pieLibDep of allPieLibDeps) {
          if (!pieLibUsage.has(pieLibDep)) {
            pieLibUsage.set(pieLibDep, new Set());
          }
          const usageSet = pieLibUsage.get(pieLibDep);
          if (usageSet) {
            usageSet.add(element);
          }
        }
      } else {
        report.blockedElements[element] = result.blockers;
        report.summary.blockedElements++;
      }
    }

    // Second pass: Check element-to-element dependencies
    // Elements can only be compatible if all their element dependencies are also compatible
    if (verbose) {
      this.logger.info('\n🔗 Checking element-to-element dependencies...\n');
    }

    let changed = true;
    while (changed) {
      changed = false;
      for (const element of elements) {
        const details = report.elementDetails[element];
        if (!details?.compatible) continue; // Already blocked, skip

        // Check if this element depends on any blocked elements
        for (const depElement of details.pieElementDeps) {
          const depDetails = report.elementDetails[depElement];

          if (!depDetails?.compatible) {
            // This element depends on a blocked element
            const blocker = `@pie-element/${depElement} - dependency is not ESM compatible`;
            details.blockers.push(blocker);
            details.compatible = false;

            // Move from compatible to blocked
            const idx = report.elements.indexOf(element);
            if (idx !== -1) {
              report.elements.splice(idx, 1);
              report.summary.compatibleElements--;
            }
            report.blockedElements[element] = details.blockers;
            report.summary.blockedElements++;

            changed = true;

            if (verbose) {
              this.logger.info(`  ❌ ${element}: depends on blocked element ${depElement}`);
            }
            break;
          }
        }
      }
    }

    // Build pie-lib report
    for (const [pieLibPkg, usedBy] of pieLibUsage.entries()) {
      const check = pieLibCache.get(pieLibPkg);
      if (check?.compatible) {
        report.pieLibPackages.push(pieLibPkg);
        report.pieLibDetails[pieLibPkg] = {
          compatible: true,
          usedBy: Array.from(usedBy),
          blockers: [],
        };
      } else if (check) {
        report.pieLibDetails[pieLibPkg] = {
          compatible: false,
          usedBy: Array.from(usedBy),
          blockers: check.blockers,
        };
      }
    }

    // Add always-include pie-lib packages if they're compatible
    for (const pieLibPkg of ALWAYS_INCLUDE_PIE_LIB) {
      // Skip if already in the report
      if (pieLibUsage.has(pieLibPkg)) {
        continue;
      }

      // Check if this package exists and is compatible
      let check = pieLibCache.get(pieLibPkg);
      if (!check) {
        check = await this.checkPieLibCompatibility(
          pieLibPkg,
          pieLibPath,
          verbose,
          includeDevDeps,
          pieLibCache
        );
        pieLibCache.set(pieLibPkg, check);
      }

      if (check.compatible) {
        report.pieLibPackages.push(pieLibPkg);
        report.pieLibDetails[pieLibPkg] = {
          compatible: true,
          usedBy: ['(always included)'], // Mark as always included
          blockers: [],
        };
        if (verbose) {
          this.logger.info(`  ✅ ${pieLibPkg}: always included (compatible)`);
        }
      } else if (verbose) {
        this.logger.info(`  ⏭️  ${pieLibPkg}: skipped (not compatible)`);
      }
    }

    report.summary.totalPieLibPackages = pieLibUsage.size + ALWAYS_INCLUDE_PIE_LIB.length;
    report.summary.compatiblePieLibPackages = report.pieLibPackages.length;

    // Identify student-UI-only elements (blocked overall but student UI is compatible)
    report.studentUIOnly = [];
    for (const element of elements) {
      const details = report.elementDetails[element];
      if (!details?.compatible && details?.studentUI?.compatible) {
        report.studentUIOnly.push(element);
      }
    }
    report.summary.studentUIOnlyElements = report.studentUIOnly.length;

    if (verbose && report.studentUIOnly.length > 0) {
      this.logger.info(
        `\n📱 Found ${report.studentUIOnly.length} elements with student-UI-only support:\n`
      );
      for (const element of report.studentUIOnly) {
        this.logger.info(`  ${element}`);
      }
    }

    // ESM player validation (only for compatible elements)
    if (validateEsmPlayer) {
      if (verbose) {
        this.logger.info('\n🎮 Validating ESM player compatibility...\n');
      }

      for (const element of report.elements) {
        const validation = await this.validateEsmPlayerCompatibility(
          element,
          pieElementsPath,
          verbose
        );

        report.esmValidation[element] = validation;

        if (validation.compatible) {
          report.esmPlayerReady.push(element);
          report.summary.esmPlayerReady++;
        }
      }
    }

    // Runtime-ish CDN probes (production-like signal)
    const base = runtimeCdnBaseUrl.replace(/\/+$/, '');

    // Probe all CommonJS-free elements by default.
    // Rationale: "ESM ready in production" is primarily about whether the CDN can resolve
    // the package + transitives into browser-loadable ESM, not whether upstream package.json
    // has ideal exports metadata (which we often rewrite during sync).
    const elementsToProbe = report.elements.slice();

    const cache = await this.loadRuntimeCache(runtimeCacheFile);

    if (verbose) {
      this.logger.info(
        `\n🌐 Probing ESM runtime readiness via CDN (${elementsToProbe.length} elements, concurrency=${runtimeConcurrency})...\n`
      );
      this.logger.info(`   CDN base: ${base}\n`);
      this.logger.info(
        `   Mode: deep (maxDepth=${runtimeMaxDepth}, maxModules=${runtimeMaxModules})\n`
      );
      this.logger.info(
        `   Local PIE resolution: enabled (pie-elements=${runtimeLocalPieElementsPath}, pie-lib=${runtimeLocalPieLibPath})\n`
      );
    } else {
      this.logger.info(
        `🌐 Probing ESM runtime readiness via CDN (${elementsToProbe.length} elements, concurrency=${runtimeConcurrency})...`
      );
    }

    const results = await this.probeElementsRuntime({
      elements: elementsToProbe,
      pieElementsPath,
      cdnBaseUrl: base,
      localPieEnabled: true,
      localPieElementsPath: runtimeLocalPieElementsPath,
      localPieLibPath: runtimeLocalPieLibPath,
      timeoutMs: runtimeTimeoutMs,
      concurrency: runtimeConcurrency,
      deep: true,
      maxDepth: runtimeMaxDepth,
      maxModules: runtimeMaxModules,
      cache,
      verbose,
    });

    let okCount = 0;
    for (const [element, result] of Object.entries(results)) {
      report.esmRuntimeValidation ??= {};
      report.esmRuntimeValidation[element] = result;
      if (result.compatible) okCount++;
    }
    report.summary.esmRuntimeReady = okCount;

    await this.saveRuntimeCache(runtimeCacheFile, cache);

    if (!verbose) {
      this.logger.info(`   Runtime-ready: ${okCount}/${elementsToProbe.length}\n`);
    }

    if (!verbose) {
      this.logger.progressComplete();
      this.logger.info('');
      this.logger.success(`${report.summary.compatibleElements} elements compatible`);
      if (report.summary.blockedElements > 0) {
        this.logger.warn(`${report.summary.blockedElements} elements blocked`);
      }
      if (report.summary.compatiblePieLibPackages > 0) {
        this.logger.info(`${report.summary.compatiblePieLibPackages} @pie-lib packages compatible`);
      }
      if (report.summary.totalPieLibPackages - report.summary.compatiblePieLibPackages > 0) {
        this.logger.warn(
          `${report.summary.totalPieLibPackages - report.summary.compatiblePieLibPackages} @pie-lib packages blocked`
        );
      }
      this.logger.info('');
      this.logger.info('Run with --verbose to see detailed blocker information');
      this.logger.info('');
    }

    return report;
  }

  private async loadRuntimeCache(
    filePath: string
  ): Promise<Record<string, EsmRuntimeValidationResult>> {
    try {
      if (!existsSync(filePath)) return {};
      const raw = await readFile(filePath, 'utf-8');
      return JSON.parse(raw) as Record<string, EsmRuntimeValidationResult>;
    } catch {
      return {};
    }
  }

  private async saveRuntimeCache(
    filePath: string,
    cache: Record<string, EsmRuntimeValidationResult>
  ): Promise<void> {
    try {
      const dir = filePath.includes('/') ? filePath.split('/').slice(0, -1).join('/') : '.';
      if (dir && dir !== '.' && !existsSync(dir)) {
        await mkdir(dir, { recursive: true });
      }
      await writeFile(filePath, JSON.stringify(cache, null, 2), 'utf-8');
    } catch {
      // Best-effort cache only.
    }
  }

  private async parseAsEsm(code: string): Promise<boolean> {
    try {
      const mod = (await import('es-module-lexer')) as unknown as {
        init: Promise<void>;
        parse: (source: string) => [unknown[], unknown];
      };
      await mod.init;
      mod.parse(code);
      return true;
    } catch {
      // Fallback: very light heuristic (still useful signal for obvious non-JS responses).
      return typeof code === 'string' && code.length > 0;
    }
  }

  private async getImportSpecifiers(code: string): Promise<string[]> {
    try {
      const mod = (await import('es-module-lexer')) as unknown as {
        init: Promise<void>;
        parse: (source: string) => [{ s: number; e: number }[], unknown];
      };
      await mod.init;
      const [imports] = mod.parse(code);
      const specs: string[] = [];
      for (const i of imports) {
        const spec = code.slice(i.s, i.e);
        if (spec) specs.push(spec);
      }
      return specs;
    } catch {
      return [];
    }
  }

  private resolveImportUrl(fromUrl: string, spec: string, cdnBaseUrl: string): string | null {
    if (!spec) return null;
    if (spec.startsWith('data:')) return null;
    if (spec.startsWith('http://') || spec.startsWith('https://')) return spec;
    if (spec.startsWith('//')) return `https:${spec}`;
    if (spec.startsWith('/')) return `${cdnBaseUrl.replace(/\/+$/, '')}${spec}`;
    if (spec.startsWith('./') || spec.startsWith('../')) return new URL(spec, fromUrl).toString();
    // Bare specifiers shouldn't typically appear in CDN output; best-effort map to base.
    return `${cdnBaseUrl.replace(/\/+$/, '')}/${spec}`;
  }

  private isPiePackageSpecifier(spec: string): boolean {
    return (
      spec.startsWith('@pie-lib/') ||
      spec.startsWith('@pie-element/') ||
      spec.startsWith('@pie-elements-ng/')
    );
  }

  private tryResolvePieToLocalFile(
    spec: string,
    pieElementsPath: string,
    pieLibPath: string
  ): string | null {
    // Map PIE package specifiers to sibling upstream source trees.
    // Supports:
    //  - @pie-lib/<name>[/subpath]        -> <pie-lib>/packages/<name>/src/...
    //  - @pie-element/<name>[/subpath]   -> <pie-elements>/packages/<name>/src/... (and controller/configure sources)
    const [scope, name, ...rest] = spec.split('/');
    const subpath = rest.join('/');

    if (scope === '@pie-lib') {
      const base = join(pieLibPath, 'packages', name, 'src');
      return this.resolveLocalEntrypoint(base, subpath);
    }

    if (scope === '@pie-element') {
      // Special-case known subpaths that live outside src/ in upstream.
      if (subpath === 'controller' || subpath.startsWith('controller/')) {
        const controllerSub = subpath === 'controller' ? '' : subpath.replace(/^controller\//, '');
        const base = join(pieElementsPath, 'packages', name, 'controller', 'src');
        return this.resolveLocalEntrypoint(base, controllerSub);
      }
      if (subpath === 'configure' || subpath.startsWith('configure/')) {
        const cfgSub = subpath === 'configure' ? '' : subpath.replace(/^configure\//, '');
        const base = join(pieElementsPath, 'packages', name, 'configure', 'src');
        return this.resolveLocalEntrypoint(base, cfgSub);
      }

      const base = join(pieElementsPath, 'packages', name, 'src');
      return this.resolveLocalEntrypoint(base, subpath);
    }

    return null;
  }

  private resolveLocalEntrypoint(srcBaseDir: string, subpath: string): string | null {
    const candidates: string[] = [];
    if (!subpath) {
      candidates.push(join(srcBaseDir, 'index.ts'));
      candidates.push(join(srcBaseDir, 'index.tsx'));
      candidates.push(join(srcBaseDir, 'index.js'));
      candidates.push(join(srcBaseDir, 'index.jsx'));
    } else {
      const normalized = subpath.replace(/^\/+/, '');
      // common convention: <subpath>/index.*
      candidates.push(join(srcBaseDir, normalized, 'index.ts'));
      candidates.push(join(srcBaseDir, normalized, 'index.tsx'));
      candidates.push(join(srcBaseDir, normalized, 'index.js'));
      candidates.push(join(srcBaseDir, normalized, 'index.jsx'));
      // direct file
      candidates.push(join(srcBaseDir, `${normalized}.ts`));
      candidates.push(join(srcBaseDir, `${normalized}.tsx`));
      candidates.push(join(srcBaseDir, `${normalized}.js`));
      candidates.push(join(srcBaseDir, `${normalized}.jsx`));
    }

    for (const c of candidates) {
      if (existsSync(c)) return `file://${c}`;
    }
    return null;
  }

  private resolveLocalImport(fromFileUrl: string, spec: string): string | null {
    // Supports extensionless TS/JS imports and index resolution.
    const fromPath = fromFileUrl.startsWith('file://')
      ? fromFileUrl.slice('file://'.length)
      : fromFileUrl;
    const baseDir = join(fromPath, '..');
    const tryPaths: string[] = [];

    const resolved = join(baseDir, spec);
    if (
      spec.endsWith('.ts') ||
      spec.endsWith('.tsx') ||
      spec.endsWith('.js') ||
      spec.endsWith('.jsx')
    ) {
      tryPaths.push(resolved);
    } else {
      tryPaths.push(resolved + '.ts');
      tryPaths.push(resolved + '.tsx');
      tryPaths.push(resolved + '.js');
      tryPaths.push(resolved + '.jsx');
      tryPaths.push(join(resolved, 'index.ts'));
      tryPaths.push(join(resolved, 'index.tsx'));
      tryPaths.push(join(resolved, 'index.js'));
      tryPaths.push(join(resolved, 'index.jsx'));
    }

    for (const p of tryPaths) {
      if (existsSync(p)) return `file://${p}`;
    }
    return null;
  }

  private getTsImportSpecifiers(code: string): string[] {
    // Minimal TS import extractor that handles import ... from "x" and export ... from "x".
    // We do not attempt full TS AST walking here to keep dependencies minimal.
    const specs = new Set<string>();
    const re = /\b(?:import|export)\s+(?:type\s+)?(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/g;
    for (const m of code.matchAll(re)) {
      if (m[1]) specs.add(m[1]);
    }
    // dynamic import("x")
    const reDyn = /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    for (const m of code.matchAll(reDyn)) {
      if (m[1]) specs.add(m[1]);
    }
    return Array.from(specs);
  }

  private async deepProbeFromUrl(opts: {
    entryUrl: string;
    cdnBaseUrl: string;
    timeoutMs: number;
    maxDepth: number;
    maxModules: number;
    logPrefix: string;
    localPieEnabled: boolean;
    localPieElementsPath: string;
    localPieLibPath: string;
  }): Promise<{
    ok: boolean;
    fetched: number;
    fetchedOk: number;
    firstFailingUrl?: string;
    errors: string[];
  }> {
    const {
      entryUrl,
      cdnBaseUrl,
      timeoutMs,
      maxDepth,
      maxModules,
      logPrefix,
      localPieEnabled,
      localPieElementsPath,
      localPieLibPath,
    } = opts;
    const visited = new Set<string>();
    const errors: string[] = [];
    let fetched = 0;
    let fetchedOk = 0;
    let firstFailingUrl: string | undefined;
    let lastLogAt = 0;

    const queue: Array<{ url: string; depth: number }> = [{ url: entryUrl, depth: 0 }];
    while (queue.length > 0) {
      const next = queue.shift();
      if (!next) break;
      if (next.depth > maxDepth) continue;
      if (visited.has(next.url)) continue;
      if (visited.size >= maxModules) break;
      visited.add(next.url);

      fetched++;
      // Periodic progress logging (deep probe can take a while)
      // Log at most every ~2s, and also on notable milestones.
      const now = Date.now();
      if (fetched === 1 || fetched % 50 === 0 || now - lastLogAt > 2000) {
        lastLogAt = now;
        this.logger.info(
          `   ⏳ ${logPrefix}: fetched ${fetched}/${maxModules} modules (ok ${fetchedOk}), queue ${queue.length}, depth ${next.depth}/${maxDepth}`
        );
      }
      const res = await this.fetchTextWithTimeout(next.url, timeoutMs);
      if (!res.ok) {
        const baseMsg = `fetch ${next.url} -> ${res.status || 'error'} (${res.text.slice(0, 120)})`;
        const jsxHint =
          typeof res.text === 'string' &&
          res.text.includes('The JSX syntax extension is not currently enabled')
            ? ' Hint: CDN failed parsing JSX in a .js/.mjs file. This usually means the published package contains uncompiled JSX; fix build output or file extensions.'
            : '';
        const msg = baseMsg + jsxHint;
        errors.push(msg);
        if (!firstFailingUrl) firstFailingUrl = next.url;
        continue;
      }
      fetchedOk++;

      // For local file:// sources, parse imports in a TS-friendly way (regex-based).
      // For CDN URLs, parse as ESM and use es-module-lexer import locations.
      const isFile = next.url.startsWith('file://');
      if (!isFile) {
        const parses = await this.parseAsEsm(res.text);
        if (!parses) {
          const msg = `parse ${next.url} -> non-parseable JS`;
          errors.push(msg);
          if (!firstFailingUrl) firstFailingUrl = next.url;
          continue;
        }
      }

      const specs = isFile
        ? this.getTsImportSpecifiers(res.text)
        : await this.getImportSpecifiers(res.text);
      for (const spec of specs) {
        let resolved: string | null = null;

        // Prefer local resolution for PIE packages when enabled.
        if (localPieEnabled && this.isPiePackageSpecifier(spec)) {
          resolved = this.tryResolvePieToLocalFile(spec, localPieElementsPath, localPieLibPath);
        }

        if (!resolved) {
          if (isFile && (spec.startsWith('./') || spec.startsWith('../'))) {
            resolved = this.resolveLocalImport(next.url, spec);
          } else {
            resolved = this.resolveImportUrl(next.url, spec, cdnBaseUrl);
          }
        }

        if (!resolved) continue;
        if (!visited.has(resolved)) queue.push({ url: resolved, depth: next.depth + 1 });
      }
    }

    return { ok: errors.length === 0, fetched, fetchedOk, firstFailingUrl, errors };
  }

  private async fetchTextWithTimeout(
    url: string,
    timeoutMs: number
  ): Promise<{ ok: boolean; status: number; text: string }> {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: controller.signal });
      const text = await res.text();
      return { ok: res.ok, status: res.status, text };
    } catch (e: any) {
      return { ok: false, status: 0, text: String(e?.message || e) };
    } finally {
      clearTimeout(t);
    }
  }

  private async probeElementsRuntime(opts: {
    elements: string[];
    pieElementsPath: string;
    cdnBaseUrl: string;
    localPieEnabled: boolean;
    localPieElementsPath: string;
    localPieLibPath: string;
    timeoutMs: number;
    concurrency: number;
    deep: boolean;
    maxDepth: number;
    maxModules: number;
    cache: Record<string, EsmRuntimeValidationResult>;
    verbose: boolean;
  }): Promise<Record<string, EsmRuntimeValidationResult>> {
    const {
      elements,
      pieElementsPath,
      cdnBaseUrl,
      localPieEnabled,
      localPieElementsPath,
      localPieLibPath,
      timeoutMs,
      concurrency,
      deep,
      maxDepth,
      maxModules,
      cache,
      verbose,
    } = opts;

    const results: Record<string, EsmRuntimeValidationResult> = {};
    const queue = elements.slice();
    let done = 0;

    const worker = async () => {
      while (queue.length > 0) {
        const element = queue.shift();
        if (!element) return;

        const pkgPath = join(pieElementsPath, 'packages', element, 'package.json');
        const pkg = (await loadPackageJson(pkgPath)) as PackageJson;
        const pkgName = `@pie-element/${element}`;
        const version = String((pkg as any).version || 'latest');
        // Cache key must include probe mode + limits, otherwise a shallow cached result
        // would incorrectly satisfy a deep/transitive run.
        const cacheKey = `${cdnBaseUrl}|${pkgName}@${version}|mode=${deep ? 'deep' : 'shallow'}|depth=${maxDepth}|modules=${maxModules}`;

        if (cache[cacheKey]) {
          results[element] = cache[cacheKey];
          done++;
          if (!verbose && done % 5 === 0)
            this.logger.info(`   Progress: ${done}/${elements.length}`);
          continue;
        }

        const entryUrl = `${cdnBaseUrl}/${pkgName}@${version}`;
        const controllerUrl = `${cdnBaseUrl}/${pkgName}@${version}/controller`;

        const out: EsmRuntimeValidationResult = {
          compatible: false,
          cdnBaseUrl,
          version,
          entryOk: false,
          controllerOk: false,
          entryParseOk: false,
          controllerParseOk: false,
          errors: [],
          probeMode: deep ? 'deep' : 'shallow',
          maxDepth: deep ? maxDepth : undefined,
          maxModules: deep ? maxModules : undefined,
        };

        if (!deep) {
          const entry = await this.fetchTextWithTimeout(entryUrl, timeoutMs);
          out.entryOk = entry.ok;
          if (!entry.ok) {
            out.errors.push(
              `entry ${entryUrl} -> ${entry.status || 'error'} (${entry.text.slice(0, 120)})`
            );
          } else {
            out.entryParseOk = await this.parseAsEsm(entry.text);
            if (!out.entryParseOk) out.errors.push(`entry ${entryUrl} returned non-parseable JS`);
          }

          const ctrl = await this.fetchTextWithTimeout(controllerUrl, timeoutMs);
          out.controllerOk = ctrl.ok;
          if (!ctrl.ok) {
            out.errors.push(
              `controller ${controllerUrl} -> ${ctrl.status || 'error'} (${ctrl.text.slice(0, 120)})`
            );
          } else {
            out.controllerParseOk = await this.parseAsEsm(ctrl.text);
            if (!out.controllerParseOk)
              out.errors.push(`controller ${controllerUrl} returned non-parseable JS`);
          }

          out.compatible =
            out.entryOk && out.entryParseOk && out.controllerOk && out.controllerParseOk;
        } else {
          // Deep probe: walk import graphs for entry and controller
          // Still record the top-level entry/controller status for readability.
          const entryTop = await this.fetchTextWithTimeout(entryUrl, timeoutMs);
          out.entryOk = entryTop.ok;
          out.entryParseOk = entryTop.ok ? await this.parseAsEsm(entryTop.text) : false;

          const ctrlTop = await this.fetchTextWithTimeout(controllerUrl, timeoutMs);
          out.controllerOk = ctrlTop.ok;
          out.controllerParseOk = ctrlTop.ok ? await this.parseAsEsm(ctrlTop.text) : false;

          const entryDeep = await this.deepProbeFromUrl({
            entryUrl,
            cdnBaseUrl,
            timeoutMs,
            maxDepth,
            maxModules,
            logPrefix: `${element} entry`,
            localPieEnabled,
            localPieElementsPath,
            localPieLibPath,
          });
          const ctrlDeep = await this.deepProbeFromUrl({
            entryUrl: controllerUrl,
            cdnBaseUrl,
            timeoutMs,
            maxDepth,
            maxModules,
            logPrefix: `${element} controller`,
            localPieEnabled,
            localPieElementsPath,
            localPieLibPath,
          });

          out.fetchedModules = (entryDeep.fetched || 0) + (ctrlDeep.fetched || 0);
          out.fetchedOk = (entryDeep.fetchedOk || 0) + (ctrlDeep.fetchedOk || 0);
          out.firstFailingUrl = entryDeep.firstFailingUrl || ctrlDeep.firstFailingUrl;
          out.errors.push(...entryDeep.errors.slice(0, 5));
          out.errors.push(...ctrlDeep.errors.slice(0, 5));

          out.compatible =
            out.entryOk &&
            out.entryParseOk &&
            out.controllerOk &&
            out.controllerParseOk &&
            entryDeep.ok &&
            ctrlDeep.ok;
        }

        cache[cacheKey] = out;
        results[element] = out;

        done++;
        if (verbose) {
          this.logger.info(
            `   • ${element} -> ${out.compatible ? '✅' : '❌'} (entry:${out.entryOk ? 'ok' : 'bad'}, controller:${out.controllerOk ? 'ok' : 'bad'})`
          );
          if (!out.compatible && out.errors.length > 0) {
            this.logger.info(`     - ${out.errors[0]}`);
          }
        } else if (done % 5 === 0 || done === elements.length) {
          this.logger.info(`   Progress: ${done}/${elements.length}`);
        }
      }
    };

    await Promise.all(
      Array.from({ length: Math.max(1, Math.min(concurrency, elements.length)) }, () => worker())
    );
    return results;
  }

  private async checkElementCompatibility(
    elementName: string,
    pieElementsPath: string,
    pieLibPath: string,
    pieLibCache: Map<string, { compatible: boolean; blockers: string[] }>,
    verbose: boolean,
    includeDevDeps: boolean
  ): Promise<ElementDetail> {
    const blockers: string[] = [];
    const elementPath = join(pieElementsPath, 'packages', elementName, 'package.json');
    const pkg = await loadPackageJson(elementPath);

    if (!pkg) {
      blockers.push(`Package.json not found at ${elementPath}`);
      return { compatible: false, directDeps: [], pieLibDeps: [], pieElementDeps: [], blockers };
    }

    const deps = this.getAllDeps(pkg, includeDevDeps);
    const directDeps = Object.keys(deps);
    const pieLibDeps = this.extractPieLibDeps(deps);
    const pieElementDeps = this.extractPieElementDeps(deps);

    if (verbose) {
      this.logger.info(`\n  📦 ${elementName}:`);
      this.logger.info(`    Direct deps: ${directDeps.length}`);
      this.logger.info(`    PIE Lib deps: ${pieLibDeps.join(', ') || 'none'}`);
      this.logger.info(`    PIE Element deps: ${pieElementDeps.join(', ') || 'none'}`);
    }

    // Deep scan all dependencies recursively
    const depCache = new Map<string, { compatible: boolean; blockers: string[] }>();
    for (const [dep, version] of Object.entries(deps)) {
      // Skip pie-lib packages - we'll check those separately
      if (dep.startsWith('@pie-lib/')) {
        continue;
      }

      await this.checkDependencyDeep(
        dep,
        version,
        pieElementsPath,
        pieLibPath,
        depCache,
        blockers,
        verbose,
        includeDevDeps,
        []
      );
    }

    // Check transitive pie-lib dependencies
    for (const pieLibDep of pieLibDeps) {
      let pieLibCheck = pieLibCache.get(pieLibDep);

      if (!pieLibCheck) {
        pieLibCheck = await this.checkPieLibCompatibility(
          pieLibDep,
          pieLibPath,
          verbose,
          includeDevDeps,
          pieLibCache
        );
        pieLibCache.set(pieLibDep, pieLibCheck);
      }

      if (!pieLibCheck.compatible) {
        for (const blocker of pieLibCheck.blockers) {
          const transitiveBlocker = `@pie-lib/${pieLibDep} -> ${blocker}`;
          blockers.push(transitiveBlocker);
          if (verbose) {
            this.logger.info(`    ❌ Transitive: ${transitiveBlocker}`);
          }
        }
      }
    }

    const compatible = blockers.length === 0;

    if (verbose && compatible) {
      this.logger.info('    ✅ Compatible!');
    }

    return {
      compatible,
      directDeps,
      pieLibDeps,
      pieElementDeps,
      blockers,
    };
  }

  /**
   * Check subdirectory compatibility (src/, configure/, controller/)
   * Returns compatibility status for each subdirectory that has its own package.json
   */
  private async checkSubdirectoryCompatibility(
    elementName: string,
    subdirName: 'src' | 'configure' | 'controller',
    pieElementsPath: string,
    pieLibPath: string,
    pieLibCache: Map<string, { compatible: boolean; blockers: string[] }>,
    verbose: boolean,
    includeDevDeps: boolean
  ): Promise<{ compatible: boolean; blockers: string[] } | null> {
    const subdirPath = join(pieElementsPath, 'packages', elementName, subdirName);
    const pkgJsonPath = join(subdirPath, 'package.json');

    // If no package.json in subdirectory, it's part of the main element
    if (!existsSync(pkgJsonPath)) {
      return null;
    }

    const blockers: string[] = [];
    const pkg = await loadPackageJson(pkgJsonPath);

    if (!pkg) {
      return null;
    }

    const deps = this.getAllDeps(pkg, includeDevDeps);
    const pieLibDeps = this.extractPieLibDeps(deps);

    if (verbose) {
      this.logger.info(`    📁 ${subdirName}/: checking ${Object.keys(deps).length} dependencies`);
    }

    // Deep scan all dependencies
    const depCache = new Map<string, { compatible: boolean; blockers: string[] }>();
    for (const [dep, version] of Object.entries(deps)) {
      if (dep.startsWith('@pie-lib/')) {
        continue;
      }

      await this.checkDependencyDeep(
        dep,
        version,
        pieElementsPath,
        pieLibPath,
        depCache,
        blockers,
        verbose,
        includeDevDeps,
        []
      );
    }

    // Check pie-lib dependencies
    for (const pieLibDep of pieLibDeps) {
      let pieLibCheck = pieLibCache.get(pieLibDep);

      if (!pieLibCheck) {
        pieLibCheck = await this.checkPieLibCompatibility(
          pieLibDep,
          pieLibPath,
          verbose,
          includeDevDeps,
          pieLibCache
        );
        pieLibCache.set(pieLibDep, pieLibCheck);
      }

      if (!pieLibCheck.compatible) {
        for (const blocker of pieLibCheck.blockers) {
          const transitiveBlocker = `@pie-lib/${pieLibDep} -> ${blocker}`;
          blockers.push(transitiveBlocker);
          if (verbose) {
            this.logger.info(`      ❌ ${subdirName}/: ${transitiveBlocker}`);
          }
        }
      }
    }

    const compatible = blockers.length === 0;

    if (verbose) {
      if (compatible) {
        this.logger.info(`      ✅ ${subdirName}/: Compatible`);
      } else {
        this.logger.info(`      ❌ ${subdirName}/: Blocked`);
      }
    }

    return { compatible, blockers };
  }

  private async checkDependencyDeep(
    depName: string,
    version: string,
    pieElementsPath: string,
    pieLibPath: string,
    cache: Map<string, { compatible: boolean; blockers: string[] }>,
    blockers: string[],
    verbose: boolean,
    includeDevDeps: boolean,
    depChain: string[]
  ): Promise<void> {
    const depKey = `${depName}@${version}`;

    // Check cache
    if (cache.has(depKey)) {
      const cached = cache.get(depKey);
      if (cached && !cached.compatible) {
        for (const blocker of cached.blockers) {
          const chain = [...depChain, blocker].join(' -> ');
          if (!blockers.includes(chain)) {
            blockers.push(chain);
          }
        }
      }
      return;
    }

    // Check if this is a known ESM blocker
    const blocker = this.checkEsmBlocker(depName, version);
    if (blocker) {
      const chain = [...depChain, blocker].join(' -> ');
      if (!blockers.includes(chain)) {
        blockers.push(chain);
        if (verbose) {
          this.logger.info(`    ❌ Transitive: ${chain}`);
        }
      }
      cache.set(depKey, { compatible: false, blockers: [blocker] });
      return;
    }

    // Try to load package.json from upstream repos to get transitive deps
    // Look in pie-elements node_modules first, then pie-lib node_modules
    let pkg: PackageJson | null = null;
    const possiblePaths = [
      join(pieElementsPath, 'node_modules', depName, 'package.json'),
      join(pieLibPath, 'node_modules', depName, 'package.json'),
    ];

    for (const path of possiblePaths) {
      if (existsSync(path)) {
        pkg = await loadPackageJson(path);
        if (pkg) break;
      }
    }

    if (!pkg) {
      // Can't resolve - assume compatible (will be caught by runtime validation if problematic)
      cache.set(depKey, { compatible: true, blockers: [] });
      return;
    }

    // Check transitive dependencies
    const transitiveDeps = this.getAllDeps(pkg, false); // Don't include devDeps for transitive checks
    const hasBlockers = false;

    for (const [transitiveDep, transitiveVersion] of Object.entries(transitiveDeps)) {
      // Skip PIE packages in transitive scan
      if (
        transitiveDep.startsWith('@pie-lib/') ||
        transitiveDep.startsWith('@pie-element/') ||
        transitiveDep.startsWith('@pie-elements-ng/')
      ) {
        continue;
      }

      await this.checkDependencyDeep(
        transitiveDep,
        transitiveVersion,
        pieElementsPath,
        pieLibPath,
        cache,
        blockers,
        verbose,
        includeDevDeps,
        [...depChain, `${depName}@${version}`]
      );
    }

    cache.set(depKey, { compatible: !hasBlockers, blockers: [] });
  }

  private async checkPieLibCompatibility(
    pkgName: string,
    pieLibPath: string,
    verbose: boolean,
    includeDevDeps: boolean,
    pieLibCache?: Map<string, { compatible: boolean; blockers: string[] }>
  ): Promise<{
    compatible: boolean;
    blockers: string[];
  }> {
    // Check cache first to avoid infinite recursion
    if (pieLibCache?.has(pkgName)) {
      const cached = pieLibCache.get(pkgName);
      if (cached) return cached;
    }

    const blockers: string[] = [];
    const pkgPath = join(pieLibPath, 'packages', pkgName, 'package.json');
    const pkg = await loadPackageJson(pkgPath);

    if (!pkg) {
      blockers.push(`Package.json not found at ${pkgPath}`);
      return { compatible: false, blockers };
    }

    const deps = this.getAllDeps(pkg, includeDevDeps);

    // Check direct dependencies for blockers
    for (const [dep, version] of Object.entries(deps)) {
      // Check for direct ESM blockers (non pie-lib packages)
      if (!dep.startsWith('@pie-lib/')) {
        const blocker = this.checkEsmBlocker(dep, version);
        if (blocker) {
          blockers.push(blocker);
          if (verbose) {
            this.logger.info(`    ❌ ${pkgName}: ${blocker}`);
          }
        }
      }
    }

    // Store preliminary result in cache to prevent infinite recursion
    const preliminaryResult = {
      compatible: blockers.length === 0,
      blockers: [...blockers],
    };
    if (pieLibCache) {
      pieLibCache.set(pkgName, preliminaryResult);
    }

    // Recursively check transitive pie-lib dependencies
    const pieLibDeps = this.extractPieLibDeps(deps);
    for (const transitivePieLib of pieLibDeps) {
      const transitiveCheck = await this.checkPieLibCompatibility(
        transitivePieLib,
        pieLibPath,
        verbose,
        includeDevDeps,
        pieLibCache
      );

      if (!transitiveCheck.compatible) {
        for (const blocker of transitiveCheck.blockers) {
          const transitiveBlocker = `@pie-lib/${transitivePieLib} -> ${blocker}`;
          blockers.push(transitiveBlocker);
          if (verbose) {
            this.logger.info(`    ❌ ${pkgName}: transitive ${transitiveBlocker}`);
          }
        }
      }
    }

    // Update cache with final result
    const finalResult = {
      compatible: blockers.length === 0,
      blockers,
    };
    if (pieLibCache) {
      pieLibCache.set(pkgName, finalResult);
    }

    return finalResult;
  }

  /**
   * Collect all transitive pie-lib dependencies recursively.
   * For example, if text-select depends on style-utils, we need style-utils too.
   */
  private async collectAllTransitivePieLibDeps(
    pieLibDeps: string[],
    pieLibPath: string,
    includeDevDeps: boolean,
    visited = new Set<string>()
  ): Promise<string[]> {
    const allDeps = new Set<string>(pieLibDeps);

    for (const dep of pieLibDeps) {
      if (visited.has(dep)) {
        continue;
      }
      visited.add(dep);

      const pkgPath = join(pieLibPath, 'packages', dep, 'package.json');
      let pkg: PackageJson | null = null;
      try {
        pkg = await loadPackageJson(pkgPath);
      } catch (error) {
        // Package doesn't exist or can't be read, skip it
        continue;
      }
      if (!pkg) continue;

      const deps = this.getAllDeps(pkg, includeDevDeps);
      const transitivePieLibDeps = this.extractPieLibDeps(deps);

      // Recursively collect transitive deps
      const deepDeps = await this.collectAllTransitivePieLibDeps(
        transitivePieLibDeps,
        pieLibPath,
        includeDevDeps,
        visited
      );

      for (const transitiveDep of deepDeps) {
        allDeps.add(transitiveDep);
      }
    }

    return Array.from(allDeps);
  }

  private getAllDeps(pkg: PackageJson, includeDevDeps: boolean): Record<string, string> {
    const optionalDependencies =
      (pkg.optionalDependencies as Record<string, string> | undefined) ?? {};
    return {
      ...pkg.dependencies,
      ...optionalDependencies,
      ...(includeDevDeps ? pkg.devDependencies : {}),
    };
  }

  private extractPieLibDeps(deps: Record<string, string>): string[] {
    return Object.keys(deps)
      .filter((dep) => dep.startsWith('@pie-lib/'))
      .map((dep) => dep.replace('@pie-lib/', ''));
  }

  private extractPieElementDeps(deps: Record<string, string>): string[] {
    return Object.keys(deps)
      .filter((dep) => dep.startsWith('@pie-element/'))
      .map((dep) => dep.replace('@pie-element/', ''));
  }

  private checkEsmBlocker(dep: string, version: string): string | null {
    const depVersion = `${dep}@${version}`;

    for (const blocker of ESM_BLOCKERS) {
      if (blocker.pattern.test(depVersion) || blocker.pattern.test(dep)) {
        return `${dep}@${version} - ${blocker.reason}`;
      }
    }

    return null;
  }

  private async validateEsmPlayerCompatibility(
    elementName: string,
    pieElementsPath: string,
    verbose: boolean
  ): Promise<EsmValidationResult> {
    const blockers: string[] = [];
    const warnings: string[] = [];

    const elementPath = join(pieElementsPath, 'packages', elementName, 'package.json');
    const pkg = await loadPackageJson(elementPath);

    if (!pkg) {
      blockers.push(`Package.json not found at ${elementPath}`);
      return {
        compatible: false,
        packageJson: {
          hasTypeModule: false,
          hasExportsField: false,
          hasMainExport: false,
          hasControllerExport: false,
          sideEffectsFree: false,
          mainExportIsEsm: false,
          controllerExportIsEsm: false,
        },
        blockers,
        warnings,
      };
    }

    // Check 1: type: "module"
    const hasTypeModule = pkg.type === 'module';
    if (!hasTypeModule) {
      blockers.push('Missing "type": "module" in package.json');
    }

    // Check 2: exports field exists
    const hasExportsField = !!pkg.exports;
    if (!hasExportsField) {
      blockers.push('Missing "exports" field in package.json');
    }

    // Check 3: main export (".")
    const exportsObj = pkg.exports as Record<string, unknown> | undefined;
    const mainExport = exportsObj?.['.'];
    const hasMainExport = !!mainExport;
    if (!hasMainExport && hasExportsField) {
      blockers.push('Missing "." export in package.json exports field');
    }

    // Check 4: controller export ("./controller")
    const controllerExport = exportsObj?.['./controller'];
    const hasControllerExport = !!controllerExport;
    if (!hasControllerExport && hasExportsField) {
      warnings.push('Missing "./controller" export - ESM player needs controller subpath');
    }

    // Check 5: sideEffects
    const sideEffectsFree = pkg.sideEffects === false;
    if (!sideEffectsFree) {
      warnings.push('Consider adding "sideEffects": false for better tree-shaking');
    }

    // Check 6: main export points to .js file
    let mainExportIsEsm = false;
    if (mainExport) {
      const exportObj = mainExport as Record<string, unknown> | string;
      const mainPath =
        typeof exportObj === 'string'
          ? exportObj
          : (exportObj.import as string | undefined) || (exportObj.default as string | undefined);
      mainExportIsEsm = typeof mainPath === 'string' && mainPath.endsWith('.js');
      if (!mainExportIsEsm) {
        blockers.push(`Main export must point to .js file (ESM), got: ${mainPath}`);
      }
    }

    // Check 7: controller export points to .js file
    let controllerExportIsEsm = false;
    if (controllerExport) {
      const exportObj = controllerExport as Record<string, unknown> | string;
      const controllerPath =
        typeof exportObj === 'string'
          ? exportObj
          : (exportObj.import as string | undefined) || (exportObj.default as string | undefined);
      controllerExportIsEsm = typeof controllerPath === 'string' && controllerPath.endsWith('.js');
      if (!controllerExportIsEsm) {
        warnings.push(`Controller export should point to .js file (ESM), got: ${controllerPath}`);
      }
    }

    const validation: EsmPackageValidation = {
      hasTypeModule,
      hasExportsField,
      hasMainExport,
      hasControllerExport,
      sideEffectsFree,
      mainExportIsEsm,
      controllerExportIsEsm,
    };

    const compatible = blockers.length === 0;

    if (verbose) {
      if (compatible) {
        this.logger.info(`  ✅ ${elementName}: ESM player ready`);
      } else {
        this.logger.info(`  ❌ ${elementName}: Not ESM player ready`);
        for (const blocker of blockers) {
          this.logger.info(`     - ${blocker}`);
        }
      }
    }

    return {
      compatible,
      packageJson: validation,
      blockers,
      warnings,
    };
  }

  private printReport(report: CompatibilityReport, outputPath: string): void {
    const verbose = this.logger.isVerbose();

    if (verbose) {
      this.log(`\n${'='.repeat(70)}`);
      this.log('📊 ESM COMPATIBILITY REPORT');
      this.log('='.repeat(70));
      this.log('\n📦 Elements:');
      this.log(`   Total:              ${report.summary.totalElements}`);
      this.log(
        `   CommonJS-free:      ${report.summary.compatibleElements} ✅  (no CommonJS deps)`
      );
      if (report.esmPlayerValidationEnabled) {
        this.log(
          `   ESM player ready:   ${report.summary.esmPlayerReady} ✅  (package.json exports)`
        );
      } else {
        this.log('   ESM player ready:   n/a (validation disabled)');
      }

      if (report.esmRuntimeValidationEnabled) {
        const runtimeReady = report.summary.esmRuntimeReady ?? 0;
        this.log(`   Runtime ready:      ${runtimeReady} ✅  (CDN probe: fetch + parse)`);
      } else {
        this.log('   Runtime ready:      n/a (runtime probes disabled)');
      }
      this.log(`   Blocked:            ${report.summary.blockedElements} ❌`);

      this.log('\n📚 PIE Lib Packages:');
      this.log(`   Total:      ${report.summary.totalPieLibPackages}`);
      this.log(`   Compatible: ${report.summary.compatiblePieLibPackages} ✅`);
      this.log(
        `   Blocked:    ${report.summary.totalPieLibPackages - report.summary.compatiblePieLibPackages} ❌`
      );

      if (report.esmPlayerValidationEnabled) {
        // ESM player ready elements (best category)
        if (report.esmPlayerReady.length > 0) {
          this.log(`\n✅ ESM Player Ready (${report.esmPlayerReady.length}):`);
          for (const element of report.esmPlayerReady.sort()) {
            const validation = report.esmValidation[element];
            const deps = report.elementDetails[element]?.pieLibDeps || [];
            this.log(`   • ${element}`);
            this.log(`     - type: module ${validation.packageJson.hasTypeModule ? '✅' : '❌'}`);
            this.log(`     - exports: . ${validation.packageJson.hasMainExport ? '✅' : '❌'}`);
            this.log(
              `     - exports: ./controller ${validation.packageJson.hasControllerExport ? '✅' : '❌'}`
            );
            this.log(`     - deps: ${deps.length > 0 ? deps.join(', ') : 'none'}`);

            if (report.esmRuntimeValidationEnabled && report.esmRuntimeValidation?.[element]) {
              const r = report.esmRuntimeValidation[element];
              this.log(
                `     - runtime probe: ${r.compatible ? '✅' : '❌'} (${r.cdnBaseUrl}, entry:${r.entryOk ? 'ok' : 'bad'}, controller:${r.controllerOk ? 'ok' : 'bad'})`
              );
              if (!r.compatible && r.errors?.length) {
                this.log(`       - ${r.errors[0]}`);
              }
            }
          }
        }

        // CommonJS-free but not ESM player ready
        const commonJsFreeNotEsmReady = report.elements.filter(
          (element) => !report.esmPlayerReady.includes(element)
        );

        if (commonJsFreeNotEsmReady.length > 0) {
          this.log(
            `\n⚠️  CommonJS-free but not ESM Player Ready (${commonJsFreeNotEsmReady.length}):`
          );
          for (const element of commonJsFreeNotEsmReady.sort()) {
            const validation = report.esmValidation[element];
            this.log(`   • ${element}`);

            if (!validation.packageJson.hasTypeModule) {
              this.log(`     ❌ Missing "type": "module"`);
            }
            if (!validation.packageJson.hasExportsField) {
              this.log(`     ❌ Missing "exports" field`);
            }
            if (!validation.packageJson.hasMainExport) {
              this.log(`     ❌ Missing "." export`);
            }
            if (!validation.packageJson.hasControllerExport) {
              this.log(`     ❌ Missing "./controller" export`);
            }
            if (!validation.packageJson.mainExportIsEsm) {
              this.log(`     ❌ Main export not ESM (.js)`);
            }

            // Show warnings
            for (const warning of validation.warnings) {
              this.log(`     ⚠️  ${warning}`);
            }
          }
        }
      }

      if (Object.keys(report.blockedElements).length > 0) {
        this.log(`\n❌ Blocked Elements (${Object.keys(report.blockedElements).length}):`);
        for (const [element, blockers] of Object.entries(report.blockedElements).sort()) {
          this.log(`   • ${element}:`);
          for (const blocker of blockers) {
            this.log(`     - ${blocker}`);
          }
        }
      }

      if (report.pieLibPackages.length > 0) {
        this.log(`\n📚 Compatible PIE Lib Packages (${report.pieLibPackages.length}):`);
        for (const pkg of report.pieLibPackages.sort()) {
          const usedBy = report.pieLibDetails[pkg]?.usedBy || [];
          this.log(`   • ${pkg} (used by: ${usedBy.join(', ')})`);
        }
      }

      const blockedPieLib = Object.entries(report.pieLibDetails)
        .filter(([_, details]) => !details.compatible)
        .sort();

      if (blockedPieLib.length > 0) {
        this.log(`\n❌ Blocked PIE Lib Packages (${blockedPieLib.length}):`);
        for (const [pkg, details] of blockedPieLib) {
          this.log(`   • ${pkg} (needed by: ${details.usedBy.join(', ')}):`);
          for (const blocker of details.blockers) {
            this.log(`     - ${blocker}`);
          }
        }
      }

      this.printNotReadyActionReport(report);

      this.log(`\n${'='.repeat(70)}`);
      this.log(`\n💾 Report saved to: ${outputPath}`);
      this.log('\n💡 Next steps:');
      this.log('   1. Review the compatibility report above');
      this.log('   2. Run sync: bun run upstream:sync');
      this.log('   3. The sync will automatically use the ESM-compatible list\n');
    } else {
      // Non-verbose: just show where report was saved
      this.log(`\n💾 Report saved to: ${outputPath}`);
    }
  }

  private printNotReadyActionReport(report: CompatibilityReport): void {
    const allElements = Object.keys(report.elementDetails).sort();
    const blockedElements = allElements.filter((e) => !report.elementDetails[e]?.compatible);
    const commonJsFreeNotEsmReady = report.esmPlayerValidationEnabled
      ? report.elements.filter((e) => !report.esmPlayerReady.includes(e))
      : [];
    const runtimeNotReady =
      report.esmRuntimeValidationEnabled && report.esmRuntimeValidation
        ? Object.entries(report.esmRuntimeValidation)
            .filter(([_, r]) => !r.compatible)
            .map(([e]) => e)
        : [];

    const blockedPieLib = Object.entries(report.pieLibDetails)
      .filter(([_, details]) => !details.compatible)
      .sort();

    const hasAnyNotReady =
      blockedElements.length > 0 ||
      commonJsFreeNotEsmReady.length > 0 ||
      runtimeNotReady.length > 0 ||
      blockedPieLib.length > 0;

    if (!hasAnyNotReady) return;

    this.log('\n🚧 Not ESM-ready yet (action items for upstream maintainers)');
    this.log(
      '   Goal: “deploy package + ESM player can load entry + controller (and transitives)”\n'
    );

    if (blockedElements.length > 0) {
      this.log(`   ❌ CommonJS blockers (${blockedElements.length}):`);
      this.log(
        '   Fix: remove/upgrade/replace the listed CommonJS-only deps (direct or via @pie-lib/*).'
      );
      for (const element of blockedElements) {
        const blockers =
          report.elementDetails[element]?.blockers ?? report.blockedElements[element] ?? [];
        this.log(`\n   • ${element}`);
        for (const blocker of blockers.slice(0, 5)) {
          this.log(`     - ${blocker}`);
        }
        if (blockers.length > 5) {
          this.log(`     - …and ${blockers.length - 5} more`);
        }
        this.log('     What to do:');
        this.log(
          '       - Upgrade the dependency to a version that provides ESM + proper "exports"'
        );
        this.log(
          '       - If no ESM exists, replace the dependency or move it behind build-time code (not runtime)'
        );
      }
      this.log('');
    }

    if (report.esmPlayerValidationEnabled && commonJsFreeNotEsmReady.length > 0) {
      this.log(`   ⚠️  Package metadata / exports issues (${commonJsFreeNotEsmReady.length}):`);
      this.log(
        '   Fix: make package.json ESM-friendly so an ESM loader can resolve `@pie-element/<name>` + `/controller`.\n'
      );

      for (const element of commonJsFreeNotEsmReady.sort()) {
        const validation = report.esmValidation[element];
        if (!validation) continue;

        const pj = validation.packageJson;
        this.log(`   • ${element}`);

        const issues: string[] = [];
        const fixes: string[] = [];

        if (!pj.hasTypeModule) {
          issues.push('Missing `"type": "module"`');
          fixes.push(
            'Add `"type": "module"` (or use `.mjs` consistently) so Node/bundlers treat output as ESM.'
          );
        }
        if (!pj.hasExportsField) {
          issues.push('Missing `"exports"`');
          fixes.push(
            'Add `"exports"` with `"."` (entry) and `"./controller"` (controller) subpaths pointing at `dist/*`.'
          );
        }
        if (pj.hasExportsField && !pj.hasMainExport) {
          issues.push('Missing `"exports"."."`');
          fixes.push('Add `"exports": { ".": { "default": "./dist/index.js" } }` (path may vary).');
        }
        if (!pj.hasControllerExport) {
          issues.push('Missing `"exports"."./controller"`');
          fixes.push(
            'Add `"./controller": { "default": "./dist/controller/index.js" }` when a controller exists.'
          );
        }
        if (!pj.mainExportIsEsm) {
          issues.push('Main export does not point at a `.js` ESM build');
          fixes.push(
            'Ensure the published entry is transpiled ESM JS (no TS, no JSX) and the export points to it.'
          );
        }
        if (pj.hasControllerExport && !pj.controllerExportIsEsm) {
          issues.push('Controller export does not point at a `.js` ESM build');
          fixes.push(
            'Ensure the published controller is transpiled ESM JS (no TS, no JSX) and the export points to it.'
          );
        }

        for (const issue of issues.slice(0, 6)) {
          this.log(`     - ${issue}`);
        }
        if (validation.blockers.length > 0) {
          this.log(`     - Details: ${validation.blockers[0]}`);
        }
        if (validation.warnings.length > 0) {
          this.log(`     - Warning: ${validation.warnings[0]}`);
        }
        this.log('     What to do:');
        for (const fix of fixes.slice(0, 4)) {
          this.log(`       - ${fix}`);
        }
        this.log('');
      }
    }

    if (
      report.esmRuntimeValidationEnabled &&
      report.esmRuntimeValidation &&
      runtimeNotReady.length > 0
    ) {
      this.log(`   ❌ Runtime probe failures (${runtimeNotReady.length}):`);
      this.log(
        '   Fix: make sure the published JS parses as ESM and all transitives resolve in production-like loading.\n'
      );

      for (const element of runtimeNotReady.sort()) {
        const r = report.esmRuntimeValidation[element];
        if (!r) continue;

        this.log(`   • ${element} (CDN: ${r.cdnBaseUrl}, mode: ${r.probeMode ?? 'shallow'})`);
        if (r.firstFailingUrl) this.log(`     - First failing URL: ${r.firstFailingUrl}`);
        const firstErr = r.errors?.[0];
        if (firstErr) this.log(`     - Error: ${firstErr}`);

        const suggestions = this.suggestionsFromRuntimeError(firstErr);
        if (suggestions.length > 0) {
          this.log('     What to do:');
          for (const s of suggestions) this.log(`       - ${s}`);
        }
        this.log('');
      }
    }

    if (blockedPieLib.length > 0) {
      this.log(`   ❌ PIE lib packages blocking ESM (${blockedPieLib.length}):`);
      this.log('   Fix: these must become ESM-compatible because elements import them.\n');
      for (const [pkg, details] of blockedPieLib) {
        this.log(`   • @pie-lib/${pkg} (used by: ${details.usedBy.join(', ')})`);
        for (const blocker of details.blockers.slice(0, 5)) {
          this.log(`     - ${blocker}`);
        }
        if (details.blockers.length > 5) {
          this.log(`     - …and ${details.blockers.length - 5} more`);
        }
      }
      this.log('');
    }
  }

  private suggestionsFromRuntimeError(err: string | undefined): string[] {
    if (!err) {
      return [
        'Confirm the published entry and controller URLs return JavaScript (not HTML/404) and parse as ESM.',
        'Re-run with --verbose to see the exact failing URL + first error.',
      ];
    }

    const e = err.toLowerCase();

    if (
      e.includes('jsx syntax extension is not currently enabled') ||
      e.includes('unexpected token <')
    ) {
      return [
        'Your published output likely contains raw JSX; transpile JSX away during build (do not ship JSX in `.js/.mjs`).',
        'Verify `dist/` contains plain JS and that `package.json` exports point at those `dist/` files.',
      ];
    }

    if (e.includes('missing') && e.includes('specifier') && e.includes('exports')) {
      return [
        'A dependency is deep-importing a path that is not exposed via `"exports"`; upgrade/replace that dependency or avoid that deep import.',
        'If this is a PIE package, ensure its `"exports"` explicitly lists the needed subpaths.',
      ];
    }

    if (e.includes('could not resolve') || e.includes('not found') || e.includes('404')) {
      return [
        'Ensure the entry/controller paths you publish actually exist on the CDN (and match `package.json` exports).',
        'If the controller exists, publish it as a subpath export (e.g. `./controller`) and ship the referenced `dist/` files.',
      ];
    }

    if (
      e.includes('commonjs') ||
      e.includes('require is not defined') ||
      e.includes('module is not defined')
    ) {
      return [
        'A transitive dependency is CommonJS-only; upgrade/replace it with an ESM-capable version, or ship a pre-bundled ESM build.',
      ];
    }

    return [
      'Inspect the first failing URL and error; fix whichever dependency/output is not valid ESM.',
      'Re-run with --verbose and (if needed) increase --runtime-max-depth / --runtime-max-modules to reproduce reliably.',
    ];
  }
}
