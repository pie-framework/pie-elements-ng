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

/**
 * Check if an element exists and get its base path
 * Both React and Svelte elements follow the same conventions:
 * - Delivery: dist/index.js
 * - Controller: dist/controller/index.js
 * - Author: dist/author/index.js
 * - Print: dist/print/index.js
 */
function checkElementExists(
  elementName: string,
  subpath: string
): { exists: boolean; basePath: string | null } {
  // Check React elements first
  let elementPath = resolve(workspaceRoot, 'packages/elements-react', elementName, 'dist', subpath);

  if (existsSync(elementPath)) {
    return { exists: true, basePath: 'packages/elements-react' };
  }

  // Check Svelte elements
  elementPath = resolve(workspaceRoot, 'packages/elements-svelte', elementName, 'dist', subpath);

  if (existsSync(elementPath)) {
    return { exists: true, basePath: 'packages/elements-svelte' };
  }

  return { exists: false, basePath: null };
}

/**
 * Generate import registration for an element
 */
function generateElementImport(element: ElementMetadata, indent: string = ''): string[] {
  const lines: string[] = [];
  const elementName = element.name;

  // Check if element delivery component exists
  const deliveryInfo = checkElementExists(elementName, 'index.js');
  if (!deliveryInfo.exists || !deliveryInfo.basePath) {
    // Skip elements without a delivery component
    return [];
  }

  const basePath = deliveryInfo.basePath;

  // Check for other components
  const controllerInfo = checkElementExists(elementName, 'controller/index.js');
  const authorInfo = element.hasAuthor
    ? checkElementExists(elementName, 'author/index.js')
    : { exists: false };
  const printInfo = element.hasPrint
    ? checkElementExists(elementName, 'print/index.js')
    : { exists: false };

  lines.push(`${indent}// Register element: ${elementName}`);

  // Delivery component
  lines.push(`${indent}registerElement('${elementName}', () =>`);
  lines.push(`${indent}  import(`);
  lines.push(`${indent}    /* @vite-ignore */`);
  lines.push(`${indent}    '/@fs${workspaceRoot}/${basePath}/${elementName}/dist/index.js'`);
  lines.push(`${indent}  )`);
  lines.push(`${indent});`);

  // Controller
  if (controllerInfo.exists) {
    lines.push(`${indent}registerController('${elementName}', () =>`);
    lines.push(`${indent}  import(`);
    lines.push(`${indent}    /* @vite-ignore */`);
    lines.push(
      `${indent}    '/@fs${workspaceRoot}/${basePath}/${elementName}/dist/controller/index.js'`
    );
    lines.push(`${indent}  )`);
    lines.push(`${indent});`);
  }

  // Author
  if (authorInfo.exists) {
    lines.push(`${indent}registerAuthor('${elementName}', () =>`);
    lines.push(`${indent}  import(`);
    lines.push(`${indent}    /* @vite-ignore */`);
    lines.push(
      `${indent}    '/@fs${workspaceRoot}/${basePath}/${elementName}/dist/author/index.js'`
    );
    lines.push(`${indent}  )`);
    lines.push(`${indent});`);
  }

  // Print
  if (printInfo.exists) {
    lines.push(`${indent}registerPrint('${elementName}', () =>`);
    lines.push(`${indent}  import(`);
    lines.push(`${indent}    /* @vite-ignore */`);
    lines.push(
      `${indent}    '/@fs${workspaceRoot}/${basePath}/${elementName}/dist/print/index.js'`
    );
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
  lines.push(' * This file registers all available PIE elements with absolute paths.');
  lines.push(' * Using absolute /@fs/ paths bypasses package.json export conditions');
  lines.push(' * and ensures we load BUILT dist files for elements.');
  lines.push(' *');
  lines.push(' * IMPORTANT: We use absolute paths here instead of bare specifiers because:');
  lines.push(" * 1. Dynamic imports with variable paths (like in demo-element-loader.ts) don't");
  lines.push(" *    benefit from Vite's alias resolution");
  lines.push(' * 2. Absolute /@fs/ paths work correctly in dynamic imports');
  lines.push(' * 3. This ensures we load DIST files (fully built) instead of source files');
  lines.push(' *');
  lines.push(' * The workspace resolver plugin handles resolving dependencies that the');
  lines.push(' * element dist files import (like @pie-element/shared-math-rendering-katex)');
  lines.push(' *');
  lines.push(` * Generated: ${new Date().toISOString()}`);
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
  lines.push(` * Generated: ${new Date().toISOString()}`);
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
