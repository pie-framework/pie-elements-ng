#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { isBuiltin } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseAst } from 'vite';
import {
  collectJsFiles as collectPackageJsFiles,
  createPackageSnapshots,
  readJson,
  toPosix,
} from './lib/package-inspection.mjs';

const ROOT = process.cwd();
const POLICY_PATH = path.join(ROOT, 'scripts', 'publish-policy.json');
const BROWSER_ESM_POLICY_PATH = path.join(ROOT, 'tools', 'vite', 'browser-esm-policy.json');
const MAX_DETAILS_PER_PACKAGE = 20;
const FORBIDDEN_EXPORT_CONDITIONS = new Set(['development', 'svelte']);
// element-bundler compiles elements, so svelte is its own runtime dependency and reaches its
// clients transitively by design.
const SVELTE_DEPENDENCY_OWNERS = new Set(['@pie-element/element-bundler']);
const SHIPPED_JS_FILE = /\.[cm]?js$/;
const REQUIRE_CALLEES = new Set(['require', '__require']);
const EDITOR_RUNTIME_PACKAGE = '@pie-element/shared-editor-runtime';
const EDITOR_RUNTIME_DIR = path.join('packages', 'shared', 'editor-runtime');
// An element's editor-runtime variant lives in dist/browser/<directory>/<view>/index.js.
const EDITOR_RUNTIME_VARIANT_DIRECTORY = 'editor-runtime';
// tiptap and ProseMirror sources, which the editor runtime provides. @tiptap/react stays inside
// the element with the rest of its React code.
const EDITOR_ENGINE_SOURCE =
  /(?:^|[\\/])node_modules[\\/](?:@tiptap[\\/](?!react[\\/])[^\\/]+|prosemirror-[^\\/]+)[\\/]/;
const EXACT_VERSION = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const RUNTIME_VIEW_NAME = /^[a-z0-9][a-z0-9-]*$/;

const policy = existsSync(POLICY_PATH) ? readJson(POLICY_PATH) : {};
const browserEsmPolicy = readJson(BROWSER_ESM_POLICY_PATH);
const forbiddenPublicExports = new Map(Object.entries(policy.forbiddenPublicExports || {}));
const allowedBrowserBareImports = new Set(browserEsmPolicy.allowedBareImports || []);
const expectedBrowserSharedDependencies = browserEsmPolicy.sharedDependencyVersions || {};
const maxBrowserJsBytesPerPackage = Number(browserEsmPolicy.maxBrowserJsBytesPerPackage || 0);

const normalizeTarget = (value) => {
  if (typeof value !== 'string' || !value.startsWith('./')) return null;
  return value.slice(2);
};

const collectTargets = (value, out) => {
  const normalized = normalizeTarget(value);
  if (normalized) {
    out.add(normalized);
    return;
  }
  if (Array.isArray(value)) {
    for (const entry of value) collectTargets(entry, out);
    return;
  }
  if (value && typeof value === 'object') {
    for (const entry of Object.values(value)) collectTargets(entry, out);
  }
};

const collectExportKeyViolations = (pkg, violations) => {
  const exportKeys = new Set();
  const walk = (value, keys = []) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return;
    for (const [key, child] of Object.entries(value)) {
      const nextKeys = [...keys, key];
      if (keys.length === 0 && key.startsWith('.')) {
        exportKeys.add(key);
      }
      if (FORBIDDEN_EXPORT_CONDITIONS.has(key)) {
        violations.push(`export condition "${key}" is not allowed`);
      }
      walk(child, nextKeys);
    }
  };

  walk(pkg.exports);

  const forbiddenForPackage = forbiddenPublicExports.get(pkg.name) || [];
  for (const exportKey of forbiddenForPackage) {
    const matches = exportKey.endsWith('*')
      ? [...exportKeys].some((key) => key.startsWith(exportKey.slice(0, -1)))
      : exportKeys.has(exportKey);
    if (matches) {
      violations.push(`forbidden public export is present: ${exportKey}`);
    }
  }
};

const isMetadataFile = (filePath) =>
  /^(?:package\.json|README(?:\.[a-z]+)?|LICENSE(?:\.[a-z]+)?|CHANGELOG(?:\.[a-z]+)?)$/i.test(
    filePath
  );

const isRawSourceFile = (filePath) =>
  filePath.startsWith('src/') ||
  /\.svelte(?:\.ts)?$/.test(filePath) ||
  (/\.tsx?$/.test(filePath) && !filePath.endsWith('.d.ts'));

const normalizeManifestPath = (value) =>
  typeof value === 'string' ? value.replace(/^\.\//, '') : '';

const getDeclaredBinFiles = (pkg) => {
  if (typeof pkg.bin === 'string') return new Set([normalizeManifestPath(pkg.bin)]);
  if (!pkg.bin || typeof pkg.bin !== 'object') return new Set();
  return new Set(Object.values(pkg.bin).map(normalizeManifestPath).filter(Boolean));
};

const isAllowedPackedFile = (filePath, pkg) => {
  if (filePath.startsWith('dist/')) return true;
  if (filePath === 'controller.js' && pkg.pie?.controller?.endsWith('/controller')) {
    return true;
  }
  if (filePath === 'configure.js' && pkg.pie?.configure?.endsWith('/configure')) {
    return true;
  }
  if (filePath === 'author.js' && pkg.exports?.['./author']) {
    return true;
  }
  if (filePath === 'print.js' && pkg.exports?.['./print']) {
    return true;
  }
  if (
    (filePath === 'module/print.js' || filePath === 'module/print.js.map') &&
    pkg.exports?.['./print']
  ) {
    return true;
  }
  if (getDeclaredBinFiles(pkg).has(filePath)) return true;
  if (isMetadataFile(filePath)) return true;
  if (filePath === 'oclif.manifest.json' && pkg.oclif) return true;
  if (/\.(?:css|json|svg|png|jpg|jpeg|gif|webp|woff2?|ttf|otf|eot)$/.test(filePath)) {
    return true;
  }
  return false;
};

const collectControllerContractViolations = (dir, pkg) => {
  const violations = [];
  const controllerExport = pkg.exports?.['./controller'];
  const configureExport = pkg.exports?.['./configure'];
  const files = Array.isArray(pkg.files) ? pkg.files : [];
  const hasControllerContract =
    Boolean(controllerExport) ||
    Boolean(pkg.exports?.['./controller.js']) ||
    Boolean(pkg.pie?.controller) ||
    files.includes('controller.js');
  const hasConfigureContract =
    Boolean(configureExport) || Boolean(pkg.pie?.configure) || files.includes('configure.js');

  if (!hasControllerContract && !hasConfigureContract) {
    return violations;
  }

  const expectedControllerSpecifier = `${pkg.name}/controller`;
  const expectedConfigureSpecifier = `${pkg.name}/configure`;
  const controllerJsExport = pkg.exports?.['./controller.js'];

  if (hasControllerContract) {
    if (!controllerExport) {
      violations.push('exports["./controller"] is required for controller packages');
    }
    if (pkg.pie?.controller !== expectedControllerSpecifier) {
      violations.push(`pie.controller must be "${expectedControllerSpecifier}"`);
    }
    if (!controllerJsExport) {
      violations.push('exports["./controller.js"] is required for controller packages');
    } else if (controllerExport) {
      if (controllerJsExport.default !== controllerExport.default) {
        violations.push(
          'exports["./controller.js"].default must match exports["./controller"].default'
        );
      }
      if (controllerJsExport.types !== controllerExport.types) {
        violations.push(
          'exports["./controller.js"].types must match exports["./controller"].types'
        );
      }
    }
    if (!files.includes('controller.js')) {
      violations.push('files[] must include controller.js for controller packages');
    }
  }

  if (hasConfigureContract) {
    if (!configureExport) {
      violations.push('exports["./configure"] is required for author/configure packages');
    }
    if (pkg.pie?.configure !== expectedConfigureSpecifier) {
      violations.push(`pie.configure must be "${expectedConfigureSpecifier}"`);
    }
    if (!files.includes('configure.js')) {
      violations.push('files[] must include configure.js for author/configure packages');
    }

    const configureTarget = configureExport?.default;
    if (typeof configureTarget !== 'string' || !configureTarget.startsWith('./dist/')) {
      violations.push('exports["./configure"].default must point at ./dist/...');
    } else {
      const configureShimPath = path.join(dir, 'configure.js');
      const expectedConfigureShim = `export { default } from '${configureTarget}';\nexport * from '${configureTarget}';\n`;
      if (!existsSync(configureShimPath)) {
        violations.push('root configure.js compatibility shim is missing');
      } else {
        const configureShim = readFileSync(configureShimPath, 'utf8');
        if (configureShim !== expectedConfigureShim) {
          violations.push(`root configure.js shim must re-export ${configureTarget}`);
        }
      }
    }
  }

  // `./author` needs the shim for the same reason `./configure` does, and is the subpath one
  // element uses to reach another's authoring view: complex-rubric imports
  // `@pie-element/rubric/author` and ebsr imports `@pie-element/multiple-choice/author`. The
  // IIFE bundlers alias `@pie-element/<element>` to a directory, so those requests resolve as
  // a literal path and never consult the exports map. Without the shim the import is
  // unresolvable and the whole bundle fails - not just the authoring view - which is why a
  // combination pairing a composite element with an element it imports could not be built.
  // `./configure` points at the same dist target, so the shim contents are identical.
  const authorExport = pkg.exports?.['./author'];
  if (authorExport) {
    if (!files.includes('author.js')) {
      violations.push('files[] must include author.js for packages declaring ./author');
    }

    const authorTarget = authorExport?.default;
    if (typeof authorTarget !== 'string' || !authorTarget.startsWith('./dist/')) {
      violations.push('exports["./author"].default must point at ./dist/...');
    } else {
      const authorShimPath = path.join(dir, 'author.js');
      const expectedAuthorShim = `export { default } from '${authorTarget}';\nexport * from '${authorTarget}';\n`;
      if (!existsSync(authorShimPath)) {
        violations.push('root author.js compatibility shim is missing');
      } else {
        const authorShim = readFileSync(authorShimPath, 'utf8');
        if (authorShim !== expectedAuthorShim) {
          violations.push(`root author.js shim must re-export ${authorTarget}`);
        }
      }
    }
  }

  // Print carries the same shim contract as controller and configure: the IIFE bundlers
  // alias `@pie-element/<element>` to a directory, so `<pkg>/print` resolves to the root
  // shim as a literal path rather than through the exports map.
  const printExport = pkg.exports?.['./print'];
  if (printExport || files.includes('print.js')) {
    const printJsExport = pkg.exports?.['./print.js'];
    if (!printExport) {
      violations.push('exports["./print"] is required for print packages');
    }
    if (!printJsExport) {
      violations.push('exports["./print.js"] is required for print packages');
    } else if (printExport) {
      if (printJsExport.default !== printExport.default) {
        violations.push('exports["./print.js"].default must match exports["./print"].default');
      }
      if (printJsExport.types !== printExport.types) {
        violations.push('exports["./print.js"].types must match exports["./print"].types');
      }
    }
    if (!files.includes('print.js')) {
      violations.push('files[] must include print.js for print packages');
    }

    const printTarget = printExport?.default;
    if (typeof printTarget !== 'string' || !printTarget.startsWith('./dist/')) {
      violations.push('exports["./print"].default must point at ./dist/...');
    } else {
      const printShimPath = path.join(dir, 'print.js');
      const expectedPrintShim = `export { default } from '${printTarget}';\nexport * from '${printTarget}';\n`;
      if (!existsSync(printShimPath)) {
        violations.push('root print.js compatibility shim is missing');
      } else {
        const printShim = readFileSync(printShimPath, 'utf8');
        if (printShim !== expectedPrintShim) {
          violations.push(`root print.js shim must re-export ${printTarget}`);
        }
      }
    }
  }

  if (hasControllerContract) {
    const shimPath = path.join(dir, 'controller.js');
    if (!existsSync(shimPath)) {
      violations.push('root controller.js compatibility shim is missing');
    } else {
      const shim = readFileSync(shimPath, 'utf8');
      if (shim !== "export * from './dist/controller/index.js';\n") {
        violations.push('root controller.js shim must re-export ./dist/controller/index.js');
      }
    }
  }

  return violations;
};

const collectRelativeImportSpecifiers = (source) => {
  const specifiers = new Set();
  const patterns = [
    /\bimport\s+['"]([^'"]+)['"]/g,
    /\bimport\s[^'"]*?\bfrom\s*['"]([^'"]+)['"]/g,
    /\bexport\s[^'"]*?\bfrom\s*['"]([^'"]+)['"]/g,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      if (match[1].startsWith('.')) specifiers.add(match[1]);
    }
  }
  return [...specifiers];
};

/**
 * Walk the module graph reachable from the declared ./browser/* export targets.
 *
 * The budget exists to catch dependency drift in the shipped payload (e.g. react
 * silently becoming bundled instead of externalized), so it has to be measured
 * over what a consumer actually downloads. Summing every .js under dist/browser
 * instead also counts orphaned content-hashed chunks left behind by earlier
 * builds, which inflates the number by a whole vendor chunk and fails the gate
 * on packages whose real payload is barely half the budget.
 */
const collectReachableBrowserJsFiles = (dir, browserExportTargets) => {
  const reachable = new Set();
  const queue = [];

  for (const target of browserExportTargets) {
    const entryPath = path.resolve(dir, target.slice(2));
    if (existsSync(entryPath)) queue.push(entryPath);
  }

  while (queue.length > 0) {
    const filePath = queue.pop();
    if (reachable.has(filePath)) continue;
    reachable.add(filePath);

    const source = readFileSync(filePath, 'utf8');
    for (const specifier of collectRelativeImportSpecifiers(source)) {
      const resolved = path.resolve(path.dirname(filePath), specifier);
      for (const candidate of [resolved, `${resolved}.js`, path.join(resolved, 'index.js')]) {
        if (path.extname(candidate) === '.js' && existsSync(candidate)) {
          queue.push(candidate);
          break;
        }
      }
    }
  }

  return reachable;
};

const RELATIVE_CSS_REFERENCE_PATTERN = /["'`](\.{1,2}\/[^"'`\s]+\.css)["'`]/g;

/**
 * Every stylesheet in a browser-loaded output directory must be referenced by a module
 * reachable from that directory's entries.
 *
 * Browser ESM hosts load no element CSS, so a stylesheet no module loads never applies. Vite
 * library mode produces exactly that by default: it extracted MathQuill's CSS into
 * dist/browser/<name>.css, nothing loaded it, and every math field rendered unstyled.
 * tools/vite/browser-css-loader.ts compiles each stylesheet into the chunks that import it;
 * this is the tripwire for a build lane that loses it.
 */
const collectUnloadedStylesheetViolations = (
  dir,
  outputDir,
  reachableJsFiles,
  loadedFrom,
  isExcluded = () => false
) => {
  const referenced = new Set();
  for (const filePath of reachableJsFiles) {
    const source = readFileSync(filePath, 'utf8');
    for (const match of source.matchAll(RELATIVE_CSS_REFERENCE_PATTERN)) {
      referenced.add(path.resolve(path.dirname(filePath), match[1]));
    }
  }
  return collectPackageJsFiles(outputDir, { extensions: ['.css'] })
    .filter((cssFile) => !referenced.has(cssFile) && !isExcluded(cssFile))
    .map(
      (cssFile) =>
        `${toPosix(path.relative(dir, cssFile))} is not loaded by ${loadedFrom}, and hosts load no element CSS`
    )
    .sort();
};

const FUNCTION_NODE_TYPES = new Set([
  'ArrowFunctionExpression',
  'FunctionDeclaration',
  'FunctionExpression',
]);

const isTopLevelAwaitNode = (node) =>
  node.type === 'AwaitExpression' ||
  (node.type === 'ForOfStatement' && node.await === true) ||
  (node.type === 'VariableDeclaration' && node.kind === 'await using');

/** True when a module awaits outside every function, which makes it an async module. */
export const hasTopLevelAwait = (source) => {
  if (!source.includes('await')) return false;
  const pending = [parseAst(source)];
  while (pending.length > 0) {
    const node = pending.pop();
    if (isTopLevelAwaitNode(node)) return true;
    if (FUNCTION_NODE_TYPES.has(node.type)) continue;
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) {
        for (const child of value) if (child && typeof child === 'object') pending.push(child);
      } else if (value && typeof value === 'object') {
        pending.push(value);
      }
    }
  }
  return false;
};

/**
 * Shipped browser modules must not await at their top level. A default Vite 6 build targets
 * es2020 and fails on top-level await in any module it bundles, so one such chunk breaks the
 * build of every host that imports the element. tools/vite/browser-css-loader.ts once emitted
 * one in every chunk that imports CSS, to hold the chunk until its stylesheet applied.
 */
const collectTopLevelAwaitViolations = (dir, files) => {
  const violations = [];
  for (const filePath of [...files].sort()) {
    const relPath = toPosix(path.relative(dir, filePath));
    try {
      if (hasTopLevelAwait(readFileSync(filePath, 'utf8'))) {
        violations.push(`${relPath} uses top-level await, which default Vite 6 builds reject`);
      }
    } catch (error) {
      violations.push(
        `${relPath} could not be parsed to check for top-level await: ${error.message}`
      );
    }
  }
  return violations;
};

const collectBareImportSpecifiers = (source) => {
  const specifiers = [];
  for (const line of source.split(/\r?\n/)) {
    const match =
      line.match(/^\s*import\s+['"]([^'"]+)['"]/) ||
      line.match(/^\s*import\s+[^'"]+?\s+from\s+['"]([^'"]+)['"]/) ||
      line.match(/^\s*export\s+[^'"]+?\s+from\s+['"]([^'"]+)['"]/);
    if (!match) continue;
    const specifier = match[1];
    if (
      specifier.startsWith('.') ||
      specifier.startsWith('/') ||
      specifier.startsWith('http://') ||
      specifier.startsWith('https://')
    ) {
      continue;
    }
    specifiers.push(specifier);
  }
  return specifiers;
};

const browserSharedDependencyForSpecifier = (specifier) => {
  for (const dependencyName of Object.keys(expectedBrowserSharedDependencies)) {
    if (specifier === dependencyName || specifier.startsWith(`${dependencyName}/`)) {
      return dependencyName;
    }
  }
  return null;
};

const getPackageSlug = (pkg) =>
  typeof pkg.name === 'string' ? pkg.name.replace(/^@pie-element\//, '') : null;

const hasPublicElementAutoRegistration = (source, pkg) => {
  const slug = getPackageSlug(pkg);
  if (!slug) return false;
  const publicTag = `${slug}-element`;
  return new RegExp(`customElements\\.define\\(\\s*['"]${publicTag}['"]`).test(source);
};

const collectBrowserEsmViolations = (dir, pkg, context) => {
  const browserExports = Object.entries(pkg.exports ?? {}).filter(([key]) =>
    key.startsWith('./browser/')
  );
  if (browserExports.length === 0) {
    return pkg.pie?.browserEditorRuntime === undefined
      ? []
      : ['pie.browserEditorRuntime is declared, but the package has no ./browser/* exports'];
  }

  const violations = [];
  const browserSharedDependencies = pkg.pie?.browserSharedDependencies;
  const browserExportTargets = [];

  for (const [key, value] of browserExports) {
    const target = typeof value === 'string' ? value : value?.default;
    if (typeof target !== 'string' || !target.startsWith('./dist/browser/')) {
      violations.push(`${key} must point at ./dist/browser/...`);
      continue;
    }

    // The browser build compiles the standard view's entry, so it shares that view's declarations.
    const standardKey = `./${key.slice('./browser/'.length)}`;
    const standardTypes = pkg.exports?.[standardKey]?.types;
    const browserTypes = typeof value === 'string' ? undefined : value?.types;
    if (browserTypes !== standardTypes) {
      violations.push(`exports["${key}"].types must match exports["${standardKey}"].types`);
    }

    const targetPath = path.join(dir, target.slice(2));
    if (!existsSync(targetPath)) {
      violations.push(`${key} target is missing: ${target}`);
      continue;
    }
    browserExportTargets.push(target);
  }

  const browserDir = path.join(dir, 'dist/browser');
  const declaresVariant = pkg.pie?.browserEditorRuntime !== undefined;
  const variantDir = path.join(browserDir, EDITOR_RUNTIME_VARIANT_DIRECTORY);
  const inVariant = (filePath) =>
    declaresVariant && filePath.startsWith(`${variantDir}${path.sep}`);
  let browserJsBytes = 0;
  const requiredBrowserSharedDependencies = new Set();
  const jsFiles = collectPackageJsFiles(browserDir).filter((filePath) => !inVariant(filePath));
  const reachableJsFiles = collectReachableBrowserJsFiles(dir, browserExportTargets);
  for (const filePath of jsFiles) {
    // Budget only counts the payload reachable from the declared browser exports.
    // Unreachable files are stale chunks from an earlier build: inert dead weight,
    // not dependency drift, so they must not trip the budget.
    if (reachableJsFiles.has(filePath)) {
      browserJsBytes += readFileSync(filePath).byteLength;
    }
    const source = readFileSync(filePath, 'utf8');
    for (const specifier of collectBareImportSpecifiers(source)) {
      if (!allowedBrowserBareImports.has(specifier)) {
        const relPath = toPosix(path.relative(dir, filePath));
        violations.push(`${relPath} contains unsupported bare browser import "${specifier}"`);
        continue;
      }
      const sharedDependency = browserSharedDependencyForSpecifier(specifier);
      if (sharedDependency) {
        requiredBrowserSharedDependencies.add(sharedDependency);
      }
    }
    if (hasPublicElementAutoRegistration(source, pkg)) {
      const relPath = toPosix(path.relative(dir, filePath));
      violations.push(`${relPath} must not auto-register the public element tag`);
    }
  }
  violations.push(
    ...collectUnloadedStylesheetViolations(
      dir,
      browserDir,
      reachableJsFiles,
      'any module reachable from the ./browser/* exports',
      inVariant
    ),
    ...collectTopLevelAwaitViolations(dir, reachableJsFiles)
  );
  if (maxBrowserJsBytesPerPackage > 0 && browserJsBytes > maxBrowserJsBytesPerPackage) {
    violations.push(
      `dist/browser reachable JS size ${browserJsBytes} bytes exceeds policy budget ${maxBrowserJsBytesPerPackage} bytes`
    );
  }

  for (const dependencyName of requiredBrowserSharedDependencies) {
    const expectedVersion = expectedBrowserSharedDependencies[dependencyName];
    const actualVersion = browserSharedDependencies?.[dependencyName];
    if (actualVersion !== expectedVersion) {
      violations.push(
        `pie.browserSharedDependencies.${dependencyName} must be "${expectedVersion}" for browser ESM packages`
      );
    }
  }

  const engine = findBundledEditorEngine(reachableJsFiles);
  if (engine && !declaresVariant) {
    violations.push(
      `${toPosix(path.relative(dir, engine.filePath))} bundles the editor engine (${engine.packageName}), so the package must build the editor-runtime variant and declare it in pie.browserEditorRuntime`
    );
  }
  if (!engine && declaresVariant) {
    violations.push(
      'pie.browserEditorRuntime is declared, but no module reachable from the ./browser/* exports bundles the editor engine'
    );
  }
  violations.push(...collectEditorRuntimeVariantViolations(dir, pkg, browserExports, context));

  return violations;
};

const packageNameOfSource = (source) => {
  const segments = source
    .split(/(?:^|[\\/])node_modules[\\/]/)
    .pop()
    .split(/[\\/]/);
  return segments[0].startsWith('@') ? `${segments[0]}/${segments[1]}` : segments[0];
};

/** The first file among `jsFiles` whose sourcemap lists a tiptap or ProseMirror source. */
const findBundledEditorEngine = (jsFiles) => {
  for (const filePath of [...jsFiles].sort()) {
    const mapPath = `${filePath}.map`;
    if (!existsSync(mapPath)) continue;
    let sources;
    try {
      sources = readJson(mapPath).sources ?? [];
    } catch {
      continue;
    }
    const source = sources.find((candidate) => EDITOR_ENGINE_SOURCE.test(candidate));
    if (source) return { filePath, packageName: packageNameOfSource(source) };
  }
  return null;
};

const nameOf = (node) => (node.type === 'Identifier' ? node.name : String(node.value));

/**
 * Every module a file loads: its specifier, whether it is loaded by import or by require(), and
 * the names the file takes from it by name.
 */
const collectModuleImports = (source) => {
  const imports = [];
  const pending = [parseAst(source)];
  while (pending.length > 0) {
    const node = pending.pop();
    if (node.type === 'ImportDeclaration') {
      imports.push({
        specifier: node.source.value,
        kind: 'import',
        names: node.specifiers.flatMap((specifier) => {
          if (specifier.type === 'ImportSpecifier') return [nameOf(specifier.imported)];
          if (specifier.type === 'ImportDefaultSpecifier') return ['default'];
          return [];
        }),
      });
    } else if (node.type === 'ExportNamedDeclaration' && node.source) {
      imports.push({
        specifier: node.source.value,
        kind: 'import',
        names: node.specifiers.map((specifier) => nameOf(specifier.local)),
      });
    } else if (node.type === 'ExportAllDeclaration') {
      imports.push({ specifier: node.source.value, kind: 'import', names: [] });
    } else if (node.type === 'ImportExpression') {
      const specifier = staticSpecifier(node.source);
      if (specifier) imports.push({ specifier, kind: 'import', names: [] });
    } else if (
      node.type === 'CallExpression' &&
      node.callee.type === 'Identifier' &&
      REQUIRE_CALLEES.has(node.callee.name)
    ) {
      const specifier = staticSpecifier(node.arguments[0]);
      if (specifier) imports.push({ specifier, kind: 'require', names: [] });
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) {
        for (const child of value) if (child && typeof child === 'object') pending.push(child);
      } else if (value && typeof value === 'object') {
        pending.push(value);
      }
    }
  }
  return imports;
};

/** The names a built module exports, following its relative `export *` re-exports. */
const collectModuleExportNames = (filePath, seen = new Set()) => {
  if (!existsSync(filePath)) return null;
  const names = new Set();
  if (seen.has(filePath)) return names;
  seen.add(filePath);
  for (const node of parseAst(readFileSync(filePath, 'utf8')).body) {
    if (node.type === 'ExportDefaultDeclaration') {
      names.add('default');
    } else if (node.type === 'ExportNamedDeclaration') {
      for (const specifier of node.specifiers) names.add(nameOf(specifier.exported));
      if (node.declaration?.id) names.add(node.declaration.id.name);
      for (const declarator of node.declaration?.declarations ?? []) {
        if (declarator.id.type === 'Identifier') names.add(declarator.id.name);
      }
    } else if (node.type === 'ExportAllDeclaration') {
      if (node.exported) {
        names.add(nameOf(node.exported));
      } else if (node.source.value.startsWith('.')) {
        const target = path.resolve(path.dirname(filePath), node.source.value);
        for (const name of collectModuleExportNames(target, seen) ?? []) {
          if (name !== 'default') names.add(name);
        }
      }
    }
  }
  return names;
};

const sumFileBytes = (files) =>
  [...files].reduce((total, filePath) => total + readFileSync(filePath).byteLength, 0);

/**
 * The editor-runtime variant (dist/browser/editor-runtime) is the element's browser build with
 * the editor engine left to @pie-element/shared-editor-runtime. pie.browserEditorRuntime names the
 * runtime and the exact version the variant links against, and maps each ./browser/* view to its
 * variant. The variant may import what ./browser/* imports plus the runtime's specifiers, and
 * every name it imports from a specifier must be one that version's view for it exports, so the
 * variant links against the runtime in any browser.
 */
const collectEditorRuntimeVariantViolations = (dir, pkg, browserExports, context) => {
  const declared = pkg.pie?.browserEditorRuntime;
  if (declared === undefined) return [];
  if (!declared || typeof declared !== 'object' || Array.isArray(declared)) {
    return ['pie.browserEditorRuntime must be an object with name, version and views'];
  }

  const violations = [];
  const runtime = context?.editorRuntime ?? null;
  const fields = Object.keys(declared).sort().join(', ');
  if (fields !== 'name, version, views') {
    violations.push(
      `pie.browserEditorRuntime must have exactly name, version and views, found ${fields || 'none'}`
    );
  }
  if (declared.name !== EDITOR_RUNTIME_PACKAGE) {
    violations.push(`pie.browserEditorRuntime.name must be "${EDITOR_RUNTIME_PACKAGE}"`);
  }
  if (typeof declared.version !== 'string' || !EXACT_VERSION.test(declared.version)) {
    violations.push('pie.browserEditorRuntime.version must be an exact version');
  } else if (!runtime) {
    violations.push(`${EDITOR_RUNTIME_PACKAGE} is not in this workspace`);
  } else if (declared.version !== runtime.pkg.version) {
    violations.push(
      `pie.browserEditorRuntime.version must be "${runtime.pkg.version}", the ${EDITOR_RUNTIME_PACKAGE} version the variant is built against (run node scripts/sync-editor-runtime-version.mjs)`
    );
  }

  const runtimeModules = runtime?.pkg.pie?.browserModules ?? {};
  for (const dependencyName of Object.keys(pkg.pie?.browserSharedDependencies ?? {})) {
    if (
      dependencyName === EDITOR_RUNTIME_PACKAGE ||
      Object.hasOwn(runtimeModules, dependencyName)
    ) {
      violations.push(
        `pie.browserSharedDependencies.${dependencyName} is not allowed: the editor runtime is declared in pie.browserEditorRuntime`
      );
    }
  }

  const standardViews = browserExports.map(([key]) => key.slice('./browser/'.length)).sort();
  const views =
    declared.views && typeof declared.views === 'object' && !Array.isArray(declared.views)
      ? declared.views
      : {};
  const declaredViews = Object.keys(views).sort();
  if (declaredViews.join(', ') !== standardViews.join(', ')) {
    violations.push(
      `pie.browserEditorRuntime.views must map every ./browser/* view (${standardViews.join(', ')}), found ${declaredViews.join(', ') || 'none'}`
    );
  }
  const variantEntries = [];
  for (const view of declaredViews) {
    const expected = `${EDITOR_RUNTIME_VARIANT_DIRECTORY}/${view}`;
    if (views[view] !== expected) {
      violations.push(`pie.browserEditorRuntime.views.${view} must be "${expected}"`);
      continue;
    }
    const entry = `./dist/browser/${expected}/index.js`;
    if (!existsSync(path.join(dir, entry.slice(2)))) {
      violations.push(`pie.browserEditorRuntime.views.${view} target is missing: ${entry}`);
      continue;
    }
    variantEntries.push(entry);
  }

  const variantDir = path.join(dir, 'dist/browser', EDITOR_RUNTIME_VARIANT_DIRECTORY);
  const variantFiles = collectPackageJsFiles(variantDir).sort();
  const runtimeExportNames = new Map();
  const runtimeExportsOf = (view) => {
    if (!runtimeExportNames.has(view)) {
      runtimeExportNames.set(
        view,
        collectModuleExportNames(path.join(runtime.dir, 'dist/browser', view, 'index.js'))
      );
    }
    return runtimeExportNames.get(view);
  };
  for (const filePath of variantFiles) {
    const relPath = toPosix(path.relative(dir, filePath));
    const source = readFileSync(filePath, 'utf8');
    let imports;
    try {
      imports = collectModuleImports(source);
    } catch (error) {
      violations.push(`${relPath} could not be parsed to check its imports: ${error.message}`);
      continue;
    }
    for (const { specifier, kind, names } of imports) {
      if (specifier.startsWith('.')) continue;
      if (!Object.hasOwn(runtimeModules, specifier)) {
        if (!allowedBrowserBareImports.has(specifier)) {
          violations.push(`${relPath} contains unsupported bare browser import "${specifier}"`);
        }
        continue;
      }
      if (kind === 'require') {
        violations.push(
          `${relPath} loads "${specifier}" with require(), which a browser cannot run`
        );
        continue;
      }
      const view = runtimeModules[specifier];
      const exported = runtimeExportsOf(view);
      if (!exported) {
        violations.push(
          `${relPath} imports "${specifier}", but ${EDITOR_RUNTIME_PACKAGE} has no dist/browser/${view}/index.js`
        );
        continue;
      }
      for (const name of names) {
        if (!exported.has(name)) {
          violations.push(
            `${relPath} imports ${name} from "${specifier}", which ${EDITOR_RUNTIME_PACKAGE} dist/browser/${view}/index.js does not export`
          );
        }
      }
    }
    if (hasPublicElementAutoRegistration(source, pkg)) {
      violations.push(`${relPath} must not auto-register the public element tag`);
    }
  }

  const engine = findBundledEditorEngine(variantFiles);
  if (engine) {
    violations.push(
      `${toPosix(path.relative(dir, engine.filePath))} bundles the editor engine (${engine.packageName}), which the editor-runtime variant imports from ${EDITOR_RUNTIME_PACKAGE}`
    );
  }

  const reachableVariantFiles = collectReachableBrowserJsFiles(dir, variantEntries);
  violations.push(
    ...collectUnloadedStylesheetViolations(
      dir,
      variantDir,
      reachableVariantFiles,
      'any module reachable from the pie.browserEditorRuntime views'
    ),
    ...collectTopLevelAwaitViolations(dir, reachableVariantFiles)
  );
  const variantJsBytes = sumFileBytes(reachableVariantFiles);
  if (maxBrowserJsBytesPerPackage > 0 && variantJsBytes > maxBrowserJsBytesPerPackage) {
    violations.push(
      `dist/browser/${EDITOR_RUNTIME_VARIANT_DIRECTORY} reachable JS size ${variantJsBytes} bytes exceeds policy budget ${maxBrowserJsBytesPerPackage} bytes`
    );
  }

  return violations;
};

/**
 * @pie-element/shared-editor-runtime is one browser module per editor specifier the element
 * builds import, at dist/browser/<pie.browserModules[specifier]>/index.js. It imports nothing
 * bare, React included, so a page without React loads it, and it installs nothing.
 */
const collectEditorRuntimePackageViolations = (dir, pkg) => {
  if (pkg.name !== EDITOR_RUNTIME_PACKAGE) return [];
  const violations = [];
  for (const bucket of ['dependencies', 'peerDependencies', 'optionalDependencies']) {
    if (Object.keys(pkg[bucket] ?? {}).length > 0) {
      violations.push(`${bucket} must be empty: the editor runtime bundles everything it runs`);
    }
  }

  const modules = pkg.pie?.browserModules;
  if (!modules || typeof modules !== 'object' || Array.isArray(modules)) {
    return [...violations, 'pie.browserModules must map each editor specifier to its browser view'];
  }
  const entries = [];
  const specifierByView = new Map();
  for (const [specifier, view] of Object.entries(modules)) {
    if (specifier.startsWith('.') || specifier.startsWith('/')) {
      violations.push(`pie.browserModules key "${specifier}" must be a bare specifier`);
    }
    if (typeof view !== 'string' || !RUNTIME_VIEW_NAME.test(view)) {
      violations.push(`pie.browserModules["${specifier}"] must be a view name like "tiptap-core"`);
      continue;
    }
    if (specifierByView.has(view)) {
      violations.push(
        `pie.browserModules["${specifier}"] reuses the view of "${specifierByView.get(view)}"`
      );
      continue;
    }
    specifierByView.set(view, specifier);
    const entry = `./dist/browser/${view}/index.js`;
    if (!existsSync(path.join(dir, entry.slice(2)))) {
      violations.push(`pie.browserModules["${specifier}"] target is missing: ${entry}`);
      continue;
    }
    entries.push(entry);
  }
  if (specifierByView.size === 0) {
    violations.push('pie.browserModules must map each editor specifier to its browser view');
  }

  const browserDir = path.join(dir, 'dist/browser');
  for (const filePath of collectPackageJsFiles(browserDir).sort()) {
    const relPath = toPosix(path.relative(dir, filePath));
    let imports;
    try {
      imports = collectModuleImports(readFileSync(filePath, 'utf8'));
    } catch (error) {
      violations.push(`${relPath} could not be parsed to check its imports: ${error.message}`);
      continue;
    }
    for (const specifier of new Set(imports.map((entry) => entry.specifier))) {
      if (!specifier.startsWith('./') && !specifier.startsWith('../')) {
        violations.push(
          `${relPath} imports "${specifier}"; the editor runtime imports nothing bare`
        );
      }
    }
  }

  const reachableFiles = collectReachableBrowserJsFiles(dir, entries);
  violations.push(
    ...collectUnloadedStylesheetViolations(
      dir,
      browserDir,
      reachableFiles,
      'any module reachable from the pie.browserModules views'
    ),
    ...collectTopLevelAwaitViolations(dir, reachableFiles)
  );
  const runtimeJsBytes = sumFileBytes(reachableFiles);
  if (maxBrowserJsBytesPerPackage > 0 && runtimeJsBytes > maxBrowserJsBytesPerPackage) {
    violations.push(
      `dist/browser reachable JS size ${runtimeJsBytes} bytes exceeds policy budget ${maxBrowserJsBytesPerPackage} bytes`
    );
  }
  return violations;
};

/** The editor runtime a workspace root holds: its directory and manifest, or null. */
const readEditorRuntime = (root) => {
  const dir = path.join(root, EDITOR_RUNTIME_DIR);
  const manifestPath = path.join(dir, 'package.json');
  return existsSync(manifestPath) ? { dir, pkg: readJson(manifestPath) } : null;
};

const findEditorRuntime = (snapshots, root) => {
  const snapshot = snapshots.find((candidate) => candidate.pkg?.name === EDITOR_RUNTIME_PACKAGE);
  return snapshot ? { dir: snapshot.dir, pkg: snapshot.pkg } : readEditorRuntime(root);
};

/**
 * An element declares each shared runtime dependency (React, React DOM) in `dependencies`,
 * and never as a peer.
 *
 * The dependency is what installs React at all under legacy webpack bundlers such as
 * builder.pie-api.com, which install `dependencies` and never peers: without it
 * node_modules/react is absent in the build snapshot, and every @mui / @emotion / @dnd-kit
 * peer fails with "Module not found: Can't resolve 'react'". That shipped once:
 * @pie-lib/translator was the only package in the graph declaring React as a real
 * dependency, so every element free-rode on it, and republishing translator with a
 * peer-only declaration broke every React element at once.
 *
 * A peer lets pnpm and yarn bind the element to the host's React, so a React 19 host runs
 * the element's React 18 build on React 19.
 *
 * Scope: element packages, identified by pie.controller. Svelte elements declare no React and
 * are exempt automatically. Library packages (@pie-lib/*, @pie-element/shared-*) get the
 * inverse rule: React peer-only, because the element that consumes them owns the installable
 * pin. A library that installs its own React can resolve a second copy beside the element's.
 */
export const collectSharedRuntimeDependencyViolations = (pkg) => {
  const violations = [];
  if (!pkg.pie?.controller) {
    if (!/^@pie-(?:lib\/|element\/shared-)/.test(pkg.name || '')) return violations;
    for (const dependencyName of Object.keys(expectedBrowserSharedDependencies)) {
      for (const field of ['dependencies', 'optionalDependencies']) {
        if (dependencyName in (pkg[field] || {})) {
          violations.push(
            `${field}.${dependencyName} is not allowed in a library: the consuming element owns the installable ${dependencyName}; declare it in peerDependencies only`
          );
        }
      }
    }
    return violations;
  }

  const dependencies = pkg.dependencies || {};
  const peerDependencies = pkg.peerDependencies || {};
  const browserSharedDependencies = pkg.pie.browserSharedDependencies || {};

  for (const [dependencyName, expectedVersion] of Object.entries(
    expectedBrowserSharedDependencies
  )) {
    const declared =
      dependencyName in dependencies ||
      dependencyName in peerDependencies ||
      dependencyName in browserSharedDependencies;
    if (!declared) continue;
    if (dependencyName in peerDependencies) {
      violations.push(
        `peerDependencies.${dependencyName} is not allowed: a peer binds the element to the host's ${dependencyName}; declare it in dependencies only`
      );
    }
    const actualVersion = dependencies[dependencyName];
    // A caret range, not an exact pin. An exact pin resolves to its own copy
    // alongside the root's `^`-resolved one, and two React instances break hooks
    // ("Invalid hook call", useRef of null).
    const requiredRange = `^${expectedVersion}`;
    if (actualVersion === undefined) {
      violations.push(
        `dependencies.${dependencyName} is missing: elements install their own ${dependencyName}, and webpack bundlers install no peers; use "${requiredRange}"`
      );
    } else if (actualVersion !== requiredRange) {
      violations.push(
        `dependencies.${dependencyName} must be "${requiredRange}" (matching pie.browserSharedDependencies ${expectedVersion}), got "${actualVersion}"; an exact pin duplicates React and breaks hooks`
      );
    }
  }

  return violations;
};

// module/print.js is loaded by the same kind of host: the @pie-framework/pie-print client
// injects no CSS either. A missing module/print.js is reported by collectLegacyPrintViolations.
const collectLegacyPrintModuleViolations = (dir, pkg) => {
  if (!pkg.exports?.['./print'] || !existsSync(path.join(dir, 'module', 'print.js'))) {
    return [];
  }
  const reachableJsFiles = collectReachableBrowserJsFiles(dir, ['./module/print.js']);
  return [
    ...collectUnloadedStylesheetViolations(
      dir,
      path.join(dir, 'module'),
      reachableJsFiles,
      'module/print.js'
    ),
    ...collectTopLevelAwaitViolations(dir, reachableJsFiles),
  ];
};

const staticSpecifier = (node) => {
  if (node?.type === 'Literal' && typeof node.value === 'string') return node.value;
  if (node?.type === 'TemplateLiteral' && node.expressions.length === 0) {
    return node.quasis[0].value.cooked;
  }
  return null;
};

const moduleSpecifierOf = (node) => {
  switch (node.type) {
    case 'ImportDeclaration':
    case 'ExportAllDeclaration':
    case 'ExportNamedDeclaration':
      return node.source?.value ?? null;
    case 'ImportExpression':
      return staticSpecifier(node.source);
    case 'CallExpression':
      return node.callee.type === 'Identifier' && REQUIRE_CALLEES.has(node.callee.name)
        ? staticSpecifier(node.arguments[0])
        : null;
    default:
      return null;
  }
};

/**
 * Every module a file loads at runtime: static imports and re-exports, and import() or
 * require() of a literal specifier. Parsed rather than pattern-matched: a bundle that inlines
 * Svelte also inlines Svelte's JSDoc, and `@import { Fork } from 'svelte'` reads as an import
 * to a regex.
 */
const collectRuntimeSpecifiers = (source) => {
  const specifiers = new Set();
  const pending = [parseAst(source)];
  while (pending.length > 0) {
    const node = pending.pop();
    const specifier = moduleSpecifierOf(node);
    if (specifier) specifiers.add(specifier);
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) {
        for (const child of value) if (child && typeof child === 'object') pending.push(child);
      } else if (value && typeof value === 'object') {
        pending.push(value);
      }
    }
  }
  return specifiers;
};

const isSvelteSpecifier = (specifier) => specifier === 'svelte' || specifier.startsWith('svelte/');

/**
 * Svelte is an implementation detail. A client installs a PIE package and nothing else, so no
 * manifest asks it for svelte and no shipped file imports svelte: element builds inline the
 * Svelte runtime.
 *
 * `files` are the package-relative paths that ship, npm's packed file list at release.
 */
export const collectSvelteLeakViolations = ({ dir, pkg, files = [] }) => {
  const violations = [];
  const ownsSvelte = SVELTE_DEPENDENCY_OWNERS.has(pkg.name);

  if (pkg.svelte) {
    violations.push('package-level svelte field is not allowed');
  }
  for (const dependencyBucket of ['dependencies', 'optionalDependencies', 'peerDependencies']) {
    if (dependencyBucket === 'dependencies' && ownsSvelte) continue;
    if (pkg[dependencyBucket]?.svelte) {
      violations.push(`${dependencyBucket}.svelte is not allowed`);
    }
  }
  if (pkg.peerDependenciesMeta?.svelte) {
    violations.push('peerDependenciesMeta.svelte is not allowed');
  }
  if (ownsSvelte) return violations;

  for (const file of [...files].sort()) {
    const filePath = path.join(dir, file);
    if (!SHIPPED_JS_FILE.test(file) || !existsSync(filePath)) continue;
    const source = readFileSync(filePath, 'utf8');
    if (!source.includes('svelte')) continue;
    let specifiers;
    try {
      specifiers = collectRuntimeSpecifiers(source);
    } catch (error) {
      violations.push(`${file} could not be parsed to check its imports: ${error.message}`);
      continue;
    }
    for (const specifier of [...specifiers].sort()) {
      if (isSvelteSpecifier(specifier)) {
        violations.push(`${file} imports "${specifier}" at runtime; the build must inline Svelte`);
      }
    }
  }
  return violations;
};

const DECLARATION_FILE = /\.d\.[cm]?ts$/;
// `from '...'` and `import('...')`. A side-effect `import '...'` is left out: TypeScript does not
// resolve those.
const DECLARATION_SPECIFIER = /(?:\bfrom\s*|\bimport\s*\(\s*)['"]([^'"]+)['"]/g;
const EXTENSIONED_RELATIVE_SPECIFIER = /\.(?:[cm]?jsx?|json)$/;

const packageNameOf = (specifier) =>
  specifier
    .split('/')
    .slice(0, specifier.startsWith('@') ? 2 : 1)
    .join('/');

/**
 * Shipped declarations must resolve for a client that installed the package and nothing else,
 * under moduleResolution bundler and node16 alike: every bare import names a declared
 * dependency, and every relative import carries its extension. A dev-only dependency or an
 * extensionless path passes the build and fails only in the client's type check.
 */
export const collectDeclarationImportViolations = ({ dir, pkg, files = [] }) => {
  const declared = new Set(
    ['dependencies', 'peerDependencies', 'optionalDependencies'].flatMap((bucket) =>
      Object.keys(pkg[bucket] || {})
    )
  );
  const violations = [];
  for (const file of [...files].sort()) {
    const filePath = path.join(dir, file);
    if (!DECLARATION_FILE.test(file) || !existsSync(filePath)) continue;
    const source = readFileSync(filePath, 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '');
    const specifiers = new Set([...source.matchAll(DECLARATION_SPECIFIER)].map((m) => m[1]));
    for (const specifier of [...specifiers].sort()) {
      if (specifier.startsWith('.')) {
        if (!EXTENSIONED_RELATIVE_SPECIFIER.test(specifier)) {
          violations.push(
            `${file} imports "${specifier}", which does not resolve under moduleResolution node16 (add the .js extension)`
          );
        }
        continue;
      }
      if (isBuiltin(specifier)) continue;
      const name = packageNameOf(specifier);
      if (name === pkg.name || declared.has(name)) continue;
      violations.push(
        `${file} imports "${specifier}", which is not a dependency, peer or optional dependency`
      );
    }
  }
  return violations;
};

/**
 * An element package exports its manifest, so a host reads the version it installed from the
 * package itself instead of hand-coding one.
 */
const collectManifestExportViolations = (pkg) =>
  pkg.pie && pkg.exports?.['./package.json'] !== './package.json'
    ? ['exports["./package.json"] must be "./package.json" for element packages']
    : [];

export const collectManifestViolations = (
  dir,
  pkg,
  context = { editorRuntime: readEditorRuntime(ROOT) }
) => {
  const violations = [];
  if (Array.isArray(pkg.files)) {
    for (const entry of pkg.files) {
      const normalized = String(entry).replace(/^\.\//, '');
      if (normalized === 'src' || normalized.startsWith('src/')) {
        violations.push(`files[] includes source path: ${entry}`);
      }
      if (/\.svelte(?:\.ts)?$/.test(normalized)) {
        violations.push(`files[] includes raw Svelte source: ${entry}`);
      }
      if (/\.tsx?$/.test(normalized) && !normalized.endsWith('.d.ts')) {
        violations.push(`files[] includes raw TypeScript source: ${entry}`);
      }
    }
  }

  collectExportKeyViolations(pkg, violations);
  violations.push(...collectManifestExportViolations(pkg));
  violations.push(...collectControllerContractViolations(dir, pkg));
  violations.push(...collectBrowserEsmViolations(dir, pkg, context));
  violations.push(...collectEditorRuntimePackageViolations(dir, pkg));
  violations.push(...collectLegacyPrintModuleViolations(dir, pkg));
  violations.push(...collectSharedRuntimeDependencyViolations(pkg));

  const targets = new Set();
  for (const field of ['main', 'module', 'types', 'unpkg', 'jsdelivr']) {
    collectTargets(pkg[field], targets);
  }
  collectTargets(pkg.exports, targets);

  for (const target of [...targets].sort()) {
    if (target.startsWith('src/')) {
      violations.push(`export target points at src: ./${target}`);
      continue;
    }
    if (/\.svelte(?:\.ts)?$/.test(target)) {
      violations.push(`export target exposes raw Svelte source: ./${target}`);
      continue;
    }
    if (/\.tsx?$/.test(target) && !target.endsWith('.d.ts')) {
      violations.push(`export target exposes raw TypeScript source: ./${target}`);
      continue;
    }
    if (!target.startsWith('dist/') && !isMetadataFile(target)) {
      violations.push(`export target is outside dist: ./${target}`);
    }
  }

  return violations;
};

/**
 * A package that declares exports["./print"] must also pack module/print.js.
 *
 * The current @pie-framework/pie-print client loader fetches that path with a
 * bare import() and no import map, so it cannot read exports["./print"] at all
 * (PIE-839, docs/PRINT_SUPPORT.md). module/print.js is a separate self-contained
 * build lane, and module/ is gitignored, so a lost build step leaves no trace
 * locally - print simply stops working for every published element.
 *
 * That happened once already: the lane was added to the twelve print-enabled
 * manifests by hand, a sync regenerated scripts.build without it, and the
 * artifact vanished from every release for three weeks. This check is what makes
 * that loud instead of silent.
 */
const collectLegacyPrintViolations = (packedFiles, pkg) => {
  if (!pkg?.exports?.['./print']) return [];
  if (packedFiles.has('module/print.js')) return [];
  return [
    'module/print.js is missing: a package exporting "./print" must pack the self-contained legacy print bundle for the @pie-framework/pie-print loader (check the legacy print lane is in scripts.build)',
  ];
};

/**
 * Every file a manifest entry point names must be in the tarball. A build that
 * emits declarations under a different root (dist/src/index.d.ts for
 * dist/index.d.ts) passes every other check and still ships types that do not
 * resolve.
 */
const collectMissingTargetViolations = (packedFiles, pkg) => {
  const targets = new Set();
  for (const field of ['main', 'module', 'types', 'typings', 'unpkg', 'jsdelivr']) {
    collectTargets(pkg?.[field], targets);
  }
  collectTargets(pkg?.exports, targets);
  return [...targets]
    .filter((target) => !target.includes('*') && !packedFiles.has(target))
    .sort()
    .map((target) => `entry point target is not packed: ./${target}`);
};

export const collectPackViolations = (snapshot) => {
  const { packedFiles, pkg, packError } = snapshot;
  if (packedFiles == null && pkg == null) {
    throw new Error('invalid package snapshot');
  }
  if (packError) {
    throw packError;
  }
  if (!packedFiles) {
    throw new Error(
      'package snapshot is missing packedFiles; create snapshots with includePackedFiles'
    );
  }
  const unexpected = [...packedFiles]
    .filter((filePath) => isRawSourceFile(filePath) || !isAllowedPackedFile(filePath, pkg))
    .map((filePath) => `packed file is outside dist/metadata/assets: ${filePath}`)
    .sort();
  return [
    ...unexpected,
    ...collectMissingTargetViolations(packedFiles, pkg),
    ...collectLegacyPrintViolations(packedFiles, pkg),
  ];
};

export const collectPublishSurfaceViolations = (
  snapshot,
  context = { editorRuntime: readEditorRuntime(ROOT) }
) => {
  const violations = [
    ...collectManifestViolations(snapshot.dir, snapshot.pkg, context),
    ...collectSvelteLeakViolations({
      dir: snapshot.dir,
      pkg: snapshot.pkg,
      files: snapshot.packedFiles,
    }),
    ...collectDeclarationImportViolations({
      dir: snapshot.dir,
      pkg: snapshot.pkg,
      files: snapshot.packedFiles,
    }),
  ];
  try {
    violations.push(...collectPackViolations(snapshot));
  } catch (error) {
    violations.push(
      error.stderr?.toString()?.trim() || error.message || 'failed to inspect npm pack contents'
    );
  }
  return violations;
};

export const collectPublishSurfaceFailures = ({
  root = ROOT,
  snapshots = createPackageSnapshots({ root, includePackedFiles: true }),
} = {}) => {
  const failures = [];
  const context = { editorRuntime: findEditorRuntime(snapshots, root) };
  for (const snapshot of snapshots) {
    const violations = collectPublishSurfaceViolations(snapshot, context);
    if (violations.length > 0) {
      failures.push({
        name: snapshot.pkg.name || path.basename(snapshot.dir),
        dir: snapshot.relativeDir ?? toPosix(path.relative(root, snapshot.dir)),
        violations,
      });
    }
  }
  return failures;
};

export const printPublishSurfaceResult = (
  { failures, checked },
  { log = console.log, error = console.error } = {}
) => {
  if (failures.length === 0) {
    log(`[check-publish-surface] OK: validated ${checked} publishable package(s)`);
    return;
  }
  error(
    `[check-publish-surface] Found ${failures.length} package(s) with non-dist publish surface`
  );
  for (const failure of failures) {
    error(`\n- ${failure.name} (${failure.dir})`);
    for (const violation of failure.violations.slice(0, MAX_DETAILS_PER_PACKAGE)) {
      error(`  - ${violation}`);
    }
    const omitted = failure.violations.length - MAX_DETAILS_PER_PACKAGE;
    if (omitted > 0) error(`  - ... ${omitted} more`);
  }
};

export const runPublishSurfaceCheck = (options = {}) => {
  const snapshots =
    options.snapshots ??
    createPackageSnapshots({
      root: options.root ?? ROOT,
      includePackedFiles: true,
      packRunner: options.packRunner,
    });
  const failures = collectPublishSurfaceFailures({ root: options.root ?? ROOT, snapshots });
  const result = { ok: failures.length === 0, checked: snapshots.length, failures };
  printPublishSurfaceResult(result, options);
  return result;
};

const isDirectRun = () =>
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun()) {
  const result = runPublishSurfaceCheck();
  if (!result.ok) process.exit(1);
}
