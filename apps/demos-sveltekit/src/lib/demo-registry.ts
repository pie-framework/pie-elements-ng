export type DemoModule = {
  tagName: string;
  elementPackage: string;
  model: unknown;
  session?: unknown | null;
  def: {
    tagName: string;
    Element: unknown;
    Configure: unknown;
    controller: unknown;
  };
};

type DemoConfigModule = {
  elements?: Record<string, unknown>;
  models?: unknown[];
};

const configModules = import.meta.glob<DemoConfigModule>(
  '../../../demos-data/*/raw/config.js'
);
const sessionModules = import.meta.glob<unknown>('../../../demos-data/*/raw/session.js');

const elementModules = import.meta.glob(
  '../../../packages/elements-react/*/src/index.{ts,tsx,js,jsx}'
);
const configureModules = import.meta.glob(
  '../../../packages/elements-react/*/src/configure/index.{ts,tsx,js,jsx}'
);
const controllerModules = import.meta.glob(
  '../../../packages/elements-react/*/src/controller/index.{ts,tsx,js,jsx}'
);

type DemoIndexEntry = {
  elementPackage: string;
  configPath: string;
};

let demoIndexPromise: Promise<Map<string, DemoIndexEntry>> | null = null;

function segmentAfter(path: string, segment: string): string | null {
  const parts = path.split('/');
  const idx = parts.lastIndexOf(segment);
  if (idx === -1) return null;
  return parts[idx + 1] ?? null;
}

function normalizeConfigModule(mod: DemoConfigModule | { default?: DemoConfigModule }): DemoConfigModule {
  if ('default' in mod && mod.default) {
    return mod.default;
  }
  return mod as DemoConfigModule;
}

function extractTagName(cfg: DemoConfigModule, fallback: string): string {
  const elements = cfg.elements ?? {};
  const first = Object.keys(elements)[0];
  return first ?? fallback;
}

async function buildDemoIndex(): Promise<Map<string, DemoIndexEntry>> {
  const index = new Map<string, DemoIndexEntry>();
  for (const [path, loader] of Object.entries(configModules)) {
    const elementPackage = segmentAfter(path, 'demos-data');
    if (!elementPackage) continue;
    const mod = await loader();
    const cfg = normalizeConfigModule(mod);
    const tagName = extractTagName(cfg, elementPackage);
    index.set(tagName, { elementPackage, configPath: path });
  }
  return index;
}

async function getDemoIndex(): Promise<Map<string, DemoIndexEntry>> {
  if (!demoIndexPromise) {
    demoIndexPromise = buildDemoIndex();
  }
  return demoIndexPromise;
}

function findModulePath(
  modules: Record<string, () => Promise<unknown>>,
  segment: string,
  elementPackage: string
): string | null {
  for (const path of Object.keys(modules)) {
    const pkg = segmentAfter(path, segment);
    if (pkg === elementPackage) {
      return path;
    }
  }
  return null;
}

function normalizeSessionModule(mod: unknown): unknown | null {
  const normalized = (mod as { default?: unknown }).default ?? mod;
  if (!Array.isArray(normalized)) {
    return null;
  }
  return normalized.find((s) => s?.id === '1') ?? normalized[0] ?? null;
}

export async function listDemoTagNames(): Promise<string[]> {
  const index = await getDemoIndex();
  const tags = Array.from(index.keys());
  tags.sort();
  return tags;
}

export async function loadDemo(tagName: string): Promise<DemoModule> {
  const index = await getDemoIndex();
  const entry = index.get(tagName);
  if (!entry) {
    throw new Error(`Demo not found: ${tagName}`);
  }

  const configLoader = configModules[entry.configPath];
  const configMod = await configLoader();
  const cfg = normalizeConfigModule(configMod);
  const model = cfg.models?.[0];
  if (!model) {
    throw new Error(`Demo config for ${tagName} has no models[0]`);
  }

  const sessionPath = findModulePath(sessionModules, 'demos-data', entry.elementPackage);
  const session = sessionPath ? normalizeSessionModule(await sessionModules[sessionPath]()) : null;

  const elementPath = findModulePath(elementModules, 'elements-react', entry.elementPackage);
  const configurePath = findModulePath(configureModules, 'elements-react', entry.elementPackage);
  const controllerPath = findModulePath(controllerModules, 'elements-react', entry.elementPackage);

  if (!elementPath || !configurePath || !controllerPath) {
    throw new Error(`Missing local element sources for ${entry.elementPackage}`);
  }

  const [elementMod, configureMod, controllerMod] = await Promise.all([
    elementModules[elementPath](),
    configureModules[configurePath](),
    controllerModules[controllerPath](),
  ]);

  const Element = (elementMod as { default?: unknown }).default ?? elementMod;
  const Configure = (configureMod as { default?: unknown }).default ?? configureMod;

  return {
    tagName,
    elementPackage: entry.elementPackage,
    model,
    session,
    def: {
      tagName,
      Element,
      Configure,
      controller: controllerMod,
    },
  };
}
