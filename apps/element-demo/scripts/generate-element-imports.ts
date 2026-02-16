#!/usr/bin/env bun
/**
 * Generate element-imports.js and element-imports.d.ts
 *
 * This script automatically generates element-imports runtime/type files based on
 * the element registry and available built elements.
 *
 * Run with: bun run scripts/generate-element-imports.ts
 */

import { resolve, dirname } from 'node:path';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths
const workspaceRoot = resolve(__dirname, '../../..');
const registryPath = resolve(__dirname, '../src/lib/elements/registry.ts');
const runtimeOutputPath = resolve(__dirname, '../src/lib/element-imports.js');
const typesOutputPath = resolve(__dirname, '../src/lib/element-imports.d.ts');

interface ElementMetadata {
  name: string;
  title: string;
  packageName: string;
  hasAuthor: boolean;
  hasPrint: boolean;
  hasConfig: boolean;
  hasSession: boolean;
}

/**
 * Load element registry
 */
function loadRegistry(): ElementMetadata[] {
  const content = readFileSync(registryPath, 'utf-8');

  // Extract the ELEMENT_REGISTRY array
  const match = content.match(/export const ELEMENT_REGISTRY[^=]*=\s*(\[[\s\S]*?\]);/);
  if (!match) {
    throw new Error('Could not find ELEMENT_REGISTRY in registry.ts');
  }

  const registryJson = match[1];
  return JSON.parse(registryJson);
}

function findSourceEntry(
  baseDir: string,
  elementName: string,
  entryBase: string
): { exists: boolean; fullPath: string | null } {
  const extensions = ['.ts', '.tsx', '.js', '.jsx', '.svelte'];
  for (const ext of extensions) {
    const fullPath = resolve(workspaceRoot, baseDir, elementName, `${entryBase}${ext}`);
    if (existsSync(fullPath)) {
      return { exists: true, fullPath };
    }
  }
  return { exists: false, fullPath: null };
}

/**
 * Resolve element source entry from React or Svelte package trees.
 * We load source files for portability and to avoid build-order coupling on dist artifacts.
 */
function resolveElementSourceEntry(
  elementName: string,
  entryBase: string
): { exists: boolean; fullPath: string | null; basePath: string | null } {
  const reactEntry = findSourceEntry('packages/elements-react', elementName, entryBase);
  if (reactEntry.exists) {
    return { exists: true, fullPath: reactEntry.fullPath, basePath: 'packages/elements-react' };
  }

  const svelteEntry = findSourceEntry('packages/elements-svelte', elementName, entryBase);
  if (svelteEntry.exists) {
    return { exists: true, fullPath: svelteEntry.fullPath, basePath: 'packages/elements-svelte' };
  }

  return { exists: false, fullPath: null, basePath: null };
}

/**
 * Generate import registration for an element
 */
function generateElementImport(element: ElementMetadata, indent: string = ''): string[] {
  const lines: string[] = [];
  const elementName = element.name;

  // Check if element delivery component exists
  const deliveryInfo = resolveElementSourceEntry(elementName, 'src/index');
  if (!deliveryInfo.exists || !deliveryInfo.basePath || !deliveryInfo.fullPath) {
    // Skip elements without a delivery component
    return [];
  }

  // Check for other components
  const controllerInfo = resolveElementSourceEntry(elementName, 'src/controller/index');
  const authorInfo = element.hasAuthor
    ? resolveElementSourceEntry(elementName, 'src/author/index')
    : { exists: false };
  const printInfo = element.hasPrint
    ? resolveElementSourceEntry(elementName, 'src/print/index')
    : { exists: false };

  lines.push(`${indent}// Register element: ${elementName}`);

  // Delivery component
  lines.push(`${indent}registerElement('${elementName}', () =>`);
  lines.push(`${indent}  import(`);
  lines.push(`${indent}    /* @vite-ignore */`);
  lines.push(`${indent}    '/@fs${deliveryInfo.fullPath}'`);
  lines.push(`${indent}  )`);
  lines.push(`${indent});`);

  // Controller
  if (controllerInfo.exists) {
    lines.push(`${indent}registerController('${elementName}', () =>`);
    lines.push(`${indent}  import(`);
    lines.push(`${indent}    /* @vite-ignore */`);
    lines.push(`${indent}    '/@fs${controllerInfo.fullPath}'`);
    lines.push(`${indent}  )`);
    lines.push(`${indent});`);
  }

  // Author
  if (authorInfo.exists) {
    lines.push(`${indent}registerAuthor('${elementName}', () =>`);
    lines.push(`${indent}  import(`);
    lines.push(`${indent}    /* @vite-ignore */`);
    lines.push(`${indent}    '/@fs${authorInfo.fullPath}'`);
    lines.push(`${indent}  )`);
    lines.push(`${indent});`);
  }

  // Print
  if (printInfo.exists) {
    lines.push(`${indent}registerPrint('${elementName}', () =>`);
    lines.push(`${indent}  import(`);
    lines.push(`${indent}    /* @vite-ignore */`);
    lines.push(`${indent}    '/@fs${printInfo.fullPath}'`);
    lines.push(`${indent}  )`);
    lines.push(`${indent});`);
  }

  return lines;
}

/**
 * Generate the complete runtime element-imports.js file
 */
function generateRuntimeFile(elements: ElementMetadata[]): string {
  const lines: string[] = [];

  // Header
  lines.push('// @ts-nocheck');
  lines.push('/**');
  lines.push(' * Element Static Imports');
  lines.push(' *');
  lines.push(' * AUTO-GENERATED by scripts/generate-element-imports.ts - DO NOT EDIT MANUALLY');
  lines.push(' *');
  lines.push(' * This file registers all available PIE elements with absolute source paths.');
  lines.push(' * Using absolute /@fs/ paths bypasses package.json export conditions');
  lines.push(' * and ensures dynamic imports remain portable across environments.');
  lines.push(' *');
  lines.push(' * IMPORTANT: We use absolute paths here instead of bare specifiers because:');
  lines.push(" * 1. Dynamic imports with variable paths (like in demo-element-loader.ts) don't");
  lines.push(" *    benefit from Vite's alias resolution");
  lines.push(' * 2. Absolute /@fs/ paths work correctly in dynamic imports');
  lines.push(' * 3. Source paths avoid build-order coupling on prebuilt dist artifacts');
  lines.push(' *');
  lines.push(' * The workspace resolver plugin handles resolving dependencies that the');
  lines.push(' * element dist files import (like @pie-element/shared-math-rendering-katex)');
  lines.push(' *');
  lines.push(' * Generated at build-time by prebuild script');
  lines.push(' */');
  lines.push('');

  // Registry maps
  lines.push('// Element module registry');
  lines.push('const elementModules = new Map();');
  lines.push('const controllerModules = new Map();');
  lines.push('const authorModules = new Map();');
  lines.push('const printModules = new Map();');
  lines.push('');

  // Register helper functions
  lines.push('// Register helper functions');
  lines.push('export function registerElement(name, importer) {');
  lines.push('  elementModules.set(name, importer);');
  lines.push('}');
  lines.push('');
  lines.push('export function registerController(name, importer) {');
  lines.push('  controllerModules.set(name, importer);');
  lines.push('}');
  lines.push('');
  lines.push('export function registerAuthor(name, importer) {');
  lines.push('  authorModules.set(name, importer);');
  lines.push('}');
  lines.push('');
  lines.push('export function registerPrint(name, importer) {');
  lines.push('  printModules.set(name, importer);');
  lines.push('}');
  lines.push('');

  // Get helper functions
  lines.push('// Get helper functions');
  lines.push('export function getElementModule(name) {');
  lines.push('  return elementModules.get(name);');
  lines.push('}');
  lines.push('');
  lines.push('export function getControllerModule(name) {');
  lines.push('  return controllerModules.get(name);');
  lines.push('}');
  lines.push('');
  lines.push('export function getAuthorModule(name) {');
  lines.push('  return authorModules.get(name);');
  lines.push('}');
  lines.push('');
  lines.push('export function getPrintModule(name) {');
  lines.push('  return printModules.get(name);');
  lines.push('}');
  lines.push('');
  lines.push('export function hasElementModule(name) {');
  lines.push('  return elementModules.has(name);');
  lines.push('}');
  lines.push('');

  // Element registrations
  lines.push('// ============================================================================');
  lines.push('// ELEMENT REGISTRATIONS');
  lines.push('// ============================================================================');
  lines.push('');

  // Generate imports for each element
  for (const element of elements) {
    const elementLines = generateElementImport(element);
    if (elementLines.length > 0) {
      lines.push(...elementLines);
      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * Generate TypeScript declarations for element-imports.js
 */
function generateTypesFile(): string {
  const lines: string[] = [];
  lines.push('/**');
  lines.push(' * Element Static Imports - Type Declarations');
  lines.push(' *');
  lines.push(' * AUTO-GENERATED by scripts/generate-element-imports.ts - DO NOT EDIT MANUALLY');
  lines.push(' * Generated at build-time by prebuild script');
  lines.push(' */');
  lines.push('');
  lines.push('export type ModuleImporter = () => Promise<any>;');
  lines.push('');
  lines.push('export function registerElement(name: string, importer: ModuleImporter): void;');
  lines.push('export function registerController(name: string, importer: ModuleImporter): void;');
  lines.push('export function registerAuthor(name: string, importer: ModuleImporter): void;');
  lines.push('export function registerPrint(name: string, importer: ModuleImporter): void;');
  lines.push('');
  lines.push('export function getElementModule(name: string): ModuleImporter | undefined;');
  lines.push('export function getControllerModule(name: string): ModuleImporter | undefined;');
  lines.push('export function getAuthorModule(name: string): ModuleImporter | undefined;');
  lines.push('export function getPrintModule(name: string): ModuleImporter | undefined;');
  lines.push('export function hasElementModule(name: string): boolean;');
  return lines.join('\n');
}

/**
 * Main
 */
function main() {
  console.log('🔍 Loading element registry...');
  const elements = loadRegistry();
  console.log(`   Found ${elements.length} elements in registry`);

  console.log('📝 Generating element-imports.js and element-imports.d.ts...');
  const runtimeContent = generateRuntimeFile(elements);
  const typesContent = generateTypesFile();

  console.log(`💾 Writing runtime to ${runtimeOutputPath}`);
  writeFileSync(runtimeOutputPath, runtimeContent, 'utf-8');
  console.log(`💾 Writing types to ${typesOutputPath}`);
  writeFileSync(typesOutputPath, typesContent, 'utf-8');

  console.log('✅ Done!');
  console.log('');
  console.log('💡 The element-imports runtime/type files have been regenerated.');
  console.log("   Restart the dev server if it's running to pick up changes.");
}

main();
