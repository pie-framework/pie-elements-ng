import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { CONTRACT_FILENAME, inferViewsFromPackageExports } from './discovery.js';
import type {
  ElementPackageInfo,
  PieDocsContract,
  PieDocsPropertyMetadata,
  PieDocsSourcePointer,
  PieDocsViewMetadata,
} from './types.js';

const MODES = ['gather', 'view', 'evaluate'];

const isObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const isSourcePointer = (value: unknown): value is PieDocsSourcePointer =>
  isObject(value) &&
  typeof value.file === 'string' &&
  (value.exportName === undefined || typeof value.exportName === 'string') &&
  (value.path === undefined || typeof value.path === 'string');

const isPrimitiveEnumValue = (value: unknown): value is string | number | boolean | null =>
  value === null || ['string', 'number', 'boolean'].includes(typeof value);

const isPropertyMetadata = (value: unknown): value is PieDocsPropertyMetadata => {
  if (!isObject(value)) {
    return false;
  }
  const allowed = [
    'title',
    'description',
    'notes',
    'type',
    'required',
    'enum',
    'minimum',
    'maximum',
    'minLength',
    'maxLength',
    'pattern',
    'itemType',
    'examples',
  ];
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) {
      return false;
    }
  }
  if (value.title !== undefined && typeof value.title !== 'string') return false;
  if (value.description !== undefined && typeof value.description !== 'string') return false;
  if (value.notes !== undefined && typeof value.notes !== 'string') return false;
  if (value.type !== undefined && typeof value.type !== 'string') return false;
  if (value.required !== undefined && typeof value.required !== 'boolean') return false;
  if (value.enum !== undefined) {
    if (!Array.isArray(value.enum) || value.enum.some((entry) => !isPrimitiveEnumValue(entry))) {
      return false;
    }
  }
  for (const key of ['minimum', 'maximum', 'minLength', 'maxLength'] as const) {
    if (value[key] !== undefined && typeof value[key] !== 'number') return false;
  }
  if (value.pattern !== undefined && typeof value.pattern !== 'string') return false;
  if (value.itemType !== undefined && typeof value.itemType !== 'string') return false;
  if (value.examples !== undefined && !Array.isArray(value.examples)) return false;
  return true;
};

const normalizeMetadataMap = (
  map?: Record<string, PieDocsPropertyMetadata>
): Record<string, PieDocsPropertyMetadata> | undefined => {
  if (!map) {
    return undefined;
  }
  return Object.fromEntries(
    Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([path, metadata]) => [path, { ...metadata }])
  );
};

const isViewMetadata = (value: unknown): value is PieDocsViewMetadata => {
  if (!isObject(value)) {
    return false;
  }
  for (const key of Object.keys(value)) {
    if (!['pie', 'config'].includes(key)) {
      return false;
    }
    const map = value[key];
    if (map === undefined) continue;
    if (!isObject(map)) return false;
    for (const entry of Object.values(map)) {
      if (!isPropertyMetadata(entry)) return false;
    }
  }
  return true;
};

const normalizePointer = (pointer: PieDocsSourcePointer): PieDocsSourcePointer => ({
  file: pointer.file,
  ...(pointer.exportName ? { exportName: pointer.exportName } : {}),
  ...(pointer.path ? { path: pointer.path } : {}),
});

const normalizeContract = (contract: PieDocsContract): PieDocsContract => ({
  elementName: contract.elementName,
  packageName: contract.packageName,
  framework: contract.framework,
  ...(contract.summary ? { summary: contract.summary } : {}),
  supportedModes: contract.supportedModes?.length ? [...contract.supportedModes] : MODES,
  views: [...contract.views]
    .sort((a, b) => a.view.localeCompare(b.view))
    .map((view) => ({
      view: view.view,
      pie: normalizePointer(view.pie),
      config: normalizePointer(view.config),
      ...(view.description ? { description: view.description } : {}),
      ...(view.metadata
        ? {
            metadata: {
              ...(view.metadata.pie ? { pie: normalizeMetadataMap(view.metadata.pie) } : {}),
              ...(view.metadata.config
                ? { config: normalizeMetadataMap(view.metadata.config) }
                : {}),
            },
          }
        : {}),
    })),
});

const inferPiePointer = (packageDir: string): PieDocsSourcePointer => {
  const candidates: PieDocsSourcePointer[] = [
    { file: 'src/author/defaultConfiguration.ts', path: 'model' },
    { file: 'src/author/defaults.ts', path: 'model' },
    { file: 'src/controller/defaults.ts' },
  ];

  for (const candidate of candidates) {
    if (existsSync(join(packageDir, candidate.file))) {
      return candidate;
    }
  }

  return { file: 'src/controller/defaults.ts' };
};

const inferConfigPointer = (packageDir: string): PieDocsSourcePointer => {
  const candidates: PieDocsSourcePointer[] = [
    { file: 'src/author/defaultConfiguration.ts', path: 'configuration' },
    { file: 'src/author/defaults.ts', path: 'configuration' },
    { file: 'src/controller/defaults.ts' },
  ];

  for (const candidate of candidates) {
    if (existsSync(join(packageDir, candidate.file))) {
      return candidate;
    }
  }

  return { file: 'src/controller/defaults.ts', path: 'configuration' };
};

export const parseContract = (raw: unknown, location: string): PieDocsContract => {
  if (!isObject(raw)) {
    throw new Error(`Invalid docs contract in ${location}: expected object`);
  }
  if (typeof raw.elementName !== 'string' || !raw.elementName.trim()) {
    throw new Error(`Invalid docs contract in ${location}: elementName is required`);
  }
  if (typeof raw.packageName !== 'string' || !raw.packageName.startsWith('@pie-element/')) {
    throw new Error(`Invalid docs contract in ${location}: packageName is invalid`);
  }
  if (raw.framework !== 'react' && raw.framework !== 'svelte') {
    throw new Error(`Invalid docs contract in ${location}: framework must be react|svelte`);
  }
  if (!Array.isArray(raw.views) || raw.views.length === 0) {
    throw new Error(`Invalid docs contract in ${location}: at least one view is required`);
  }

  const views = raw.views.map((view, index) => {
    if (!isObject(view)) {
      throw new Error(`Invalid docs contract in ${location}: views[${index}] must be an object`);
    }
    if (typeof view.view !== 'string' || !view.view.trim()) {
      throw new Error(`Invalid docs contract in ${location}: views[${index}].view is required`);
    }
    if (!isSourcePointer(view.pie)) {
      throw new Error(`Invalid docs contract in ${location}: views[${index}].pie is invalid`);
    }
    if (!isSourcePointer(view.config)) {
      throw new Error(`Invalid docs contract in ${location}: views[${index}].config is invalid`);
    }
    if (view.metadata !== undefined && !isViewMetadata(view.metadata)) {
      throw new Error(`Invalid docs contract in ${location}: views[${index}].metadata is invalid`);
    }

    return {
      view: view.view,
      pie: view.pie,
      config: view.config,
      ...(typeof view.description === 'string' ? { description: view.description } : {}),
      ...(view.metadata ? { metadata: view.metadata } : {}),
    };
  });

  const supportedModes = Array.isArray(raw.supportedModes)
    ? raw.supportedModes.filter((mode): mode is string => typeof mode === 'string')
    : undefined;

  return normalizeContract({
    elementName: raw.elementName,
    packageName: raw.packageName,
    framework: raw.framework,
    summary: typeof raw.summary === 'string' ? raw.summary : undefined,
    supportedModes: supportedModes?.length ? supportedModes : MODES,
    views,
  });
};

export const loadContract = async (packageDir: string): Promise<PieDocsContract | null> => {
  const contractPath = join(packageDir, CONTRACT_FILENAME);
  if (!existsSync(contractPath)) {
    return null;
  }
  const raw = JSON.parse(await readFile(contractPath, 'utf-8')) as unknown;
  return parseContract(raw, contractPath);
};

export const writeContract = async (
  packageDir: string,
  contract: PieDocsContract
): Promise<void> => {
  const contractPath = join(packageDir, CONTRACT_FILENAME);
  const normalized = normalizeContract(contract);
  await mkdir(packageDir, { recursive: true });
  await writeFile(contractPath, `${JSON.stringify(normalized, null, 2)}\n`, 'utf-8');
};

export const seedContractForElement = async (
  element: ElementPackageInfo,
  rootDir: string,
  options?: { refresh?: boolean }
): Promise<{ wrote: boolean; contractPath: string; contract: PieDocsContract }> => {
  const contractPath = join(element.packageDir, CONTRACT_FILENAME);
  const existing = await loadContract(element.packageDir);
  if (existing && !options?.refresh) {
    return { wrote: false, contractPath, contract: existing };
  }

  const piePointer = inferPiePointer(element.packageDir);
  const configPointer = inferConfigPointer(element.packageDir);
  const views = inferViewsFromPackageExports(element.exportsMap).map((view) => ({
    view,
    pie: piePointer,
    config: configPointer,
  }));

  const contract: PieDocsContract = normalizeContract({
    elementName: element.elementName,
    packageName: element.packageName,
    framework: element.framework,
    summary: existing?.summary || element.packageDescription,
    supportedModes: existing?.supportedModes?.length ? existing.supportedModes : MODES,
    views,
  });

  await writeContract(element.packageDir, contract);

  return {
    wrote: true,
    contractPath: relative(rootDir, contractPath),
    contract,
  };
};
