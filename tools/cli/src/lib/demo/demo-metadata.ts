/**
 * Generate demo metadata for SvelteKit demo app
 *
 * Scans packages/elements-react and packages/elements-svelte and rewrites the element registry
 * (lib/elements/registry.ts). Each element's demos live in lib/samples/<element>.json, which the
 * demo app reads; an element's docs/demo/config.mjs seeds that file only when it does not exist.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '../../../../..');
const DEMO_APP_PATH = join(REPO_ROOT, 'apps/element-demo');
const REGISTRY_PATH = join(DEMO_APP_PATH, 'src/lib/elements/registry.ts');
const SAMPLES_PATH = join(DEMO_APP_PATH, 'src/lib/samples');
const ELEMENT_ROOTS = ['packages/elements-react', 'packages/elements-svelte'];

export interface ElementMetadata {
  name: string;
  title: string;
  packageName: string;
  hasAuthor: boolean;
  hasPrint: boolean;
  hasConfig: boolean;
  hasSession: boolean;
  demoCount: number;
}

/**
 * Read the current registry entries, whose hand-set title and hasSession survive regeneration
 */
function readExistingRegistry(): Map<string, ElementMetadata> {
  if (!existsSync(REGISTRY_PATH)) return new Map();

  const content = readFileSync(REGISTRY_PATH, 'utf-8');
  const match = content.match(/export const ELEMENT_REGISTRY[^=]*=\s*(\[[\s\S]*?\]);/);
  if (!match) throw new Error(`Could not find ELEMENT_REGISTRY in ${REGISTRY_PATH}`);

  const entries: ElementMetadata[] = JSON.parse(match[1]);
  return new Map(entries.map((entry) => [entry.name, entry]));
}

/**
 * Convert old format (models array) to new format (demos array)
 */
function toDemosFormat(configData: any): any {
  if (!configData?.models || configData?.demos) return configData;

  return {
    demos: configData.models.map((model: any, index: number) => ({
      id: index === 0 ? 'default' : `demo-${index + 1}`,
      title: index === 0 ? 'Default Demo' : `Demo ${index + 1}`,
      description: 'Default configuration',
      tags: [],
      model: model,
      session: { value: [] },
    })),
  };
}

/**
 * Load an element's samples JSON, seeding it from docs/demo/config.mjs when it does not exist
 */
async function loadSamples(name: string, elementPath: string): Promise<any | undefined> {
  const samplesPath = join(SAMPLES_PATH, `${name}.json`);
  const configPath = join(elementPath, 'docs/demo/config.mjs');
  const existing = existsSync(samplesPath)
    ? JSON.parse(readFileSync(samplesPath, 'utf-8'))
    : undefined;

  if (!existsSync(configPath)) return existing;

  let configData: any;
  try {
    configData = toDemosFormat((await import(`file://${configPath}`)).default);
  } catch (e) {
    console.warn(`[demo-metadata] Failed to convert config for ${name}:`, e);
    return existing;
  }

  if (existing) {
    if (JSON.stringify(configData) !== JSON.stringify(existing)) {
      console.warn(
        `[demo-metadata] ${name}: docs/demo/config.mjs differs from samples/${name}.json; ` +
          'kept the samples file (delete it to regenerate from config.mjs)'
      );
    }
    return existing;
  }

  await mkdir(SAMPLES_PATH, { recursive: true });
  await writeFile(samplesPath, JSON.stringify(configData, null, 2) + '\n', 'utf-8');
  console.log(`[demo-metadata] Seeded samples/${name}.json from docs/demo/config.mjs`);
  return configData;
}

/**
 * Scan the element package directories for all elements
 */
async function scanElements(existing: Map<string, ElementMetadata>): Promise<ElementMetadata[]> {
  const elements: ElementMetadata[] = [];

  for (const root of ELEMENT_ROOTS) {
    const rootPath = join(REPO_ROOT, root);
    if (!existsSync(rootPath)) continue;

    for (const dir of readdirSync(rootPath, { withFileTypes: true })) {
      if (!dir.isDirectory()) continue;

      // Check for required structure
      const elementPath = join(rootPath, dir.name);
      const srcPath = join(elementPath, 'src');
      if (!existsSync(join(srcPath, 'delivery'))) continue;

      const pkg = JSON.parse(readFileSync(join(elementPath, 'package.json'), 'utf-8'));
      const samples = await loadSamples(dir.name, elementPath);
      const previous = existing.get(dir.name);

      if (!previous) {
        console.log(
          `[demo-metadata] Added ${dir.name}; check its title and hasSession in registry.ts`
        );
      }

      elements.push({
        name: dir.name,
        // Generate title from name (e.g., "multiple-choice" -> "Multiple Choice")
        title:
          previous?.title ??
          dir.name
            .split('-')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' '),
        packageName: pkg.name,
        hasAuthor: existsSync(join(srcPath, 'author')),
        hasPrint: existsSync(join(srcPath, 'print')),
        hasConfig: samples !== undefined,
        hasSession: previous?.hasSession ?? true,
        demoCount: Array.isArray(samples?.demos) ? samples.demos.length : 0,
      });
    }
  }

  return elements.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Generate registry.ts file
 */
async function generateRegistry(elements: ElementMetadata[]): Promise<void> {
  const content = `/**
 * Element Registry
 *
 * Generated by \`bun tools/generate-demo-metadata.mjs\` from packages/elements-react and
 * packages/elements-svelte. Edit \`title\` and \`hasSession\` here; regeneration keeps them and
 * overwrites the other fields.
 */

export interface ElementMetadata {
  name: string;
  title: string;
  packageName: string;
  hasAuthor: boolean;
  hasPrint: boolean;
  hasConfig: boolean;
  hasSession: boolean;
  demoCount: number;
}

export const ELEMENT_REGISTRY: readonly ElementMetadata[] = ${JSON.stringify(elements, null, 2)};

export function getElement(name: string): ElementMetadata | undefined {
  return ELEMENT_REGISTRY.find((el) => el.name === name);
}

export function getAllElements(): readonly ElementMetadata[] {
  return ELEMENT_REGISTRY;
}
`;

  await mkdir(dirname(REGISTRY_PATH), { recursive: true });
  await writeFile(REGISTRY_PATH, content, 'utf-8');
  console.log(`[demo-metadata] Generated registry with ${elements.length} elements`);
}

/**
 * Main entry point
 */
export async function generateDemoMetadata(): Promise<void> {
  console.log('[demo-metadata] Scanning elements...');

  const existing = readExistingRegistry();
  const elements = await scanElements(existing);

  for (const name of existing.keys()) {
    if (!elements.some((element) => element.name === name)) {
      console.log(`[demo-metadata] Removed ${name}; no element package found`);
    }
  }

  await generateRegistry(elements);

  console.log('[demo-metadata] ✓ Demo metadata generation complete');
}
