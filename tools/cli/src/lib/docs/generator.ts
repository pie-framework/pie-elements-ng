import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { generateElementSchemas, type SchemaKind } from '../schemas/generate.js';
import { schemaDocs } from './schema-properties.js';
import { loadPointerValue } from './source-extractor.js';
import type {
  PieDocsContract,
  PieDocsElementOutput,
  PieDocsProperty,
  PieDocsSchemaDocs,
  PieDocsSourcePointer,
} from './types.js';

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
    .replaceAll('{', '&#123;')
    .replaceAll('}', '&#125;');

const formatInline = (value: unknown): string => {
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
};

const formatValue = (value: unknown): string => {
  if (typeof value === 'string') {
    return `<code>${value === '' ? '""' : escapeHtml(value)}</code>`;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return `<code>${String(value)}</code>`;
  }
  if (value === null) {
    return '<code>null</code>';
  }
  return `<code>${escapeHtml(JSON.stringify(value))}</code>`;
};

const readSummary = async (packageDir: string, fallback?: string): Promise<string> => {
  const readmePath = join(packageDir, 'README.md');
  if (existsSync(readmePath)) {
    const readme = await readFile(readmePath, 'utf-8');
    const paragraph = readme
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('#'))
      .find((line) => line.length > 20);
    if (paragraph) {
      return paragraph;
    }
  }
  return fallback || 'No summary provided.';
};

export interface GenerateDocsOptions {
  outputDir: string;
  dryRun: boolean;
  check: boolean;
}

export interface GenerateDocsResult {
  filesWritten: string[];
  filesChecked: string[];
  driftFiles: string[];
  outputs: PieDocsElementOutput[];
}

// Replace ISO-8601 timestamps with a fixed valid value so a post-normalization
// JSON.parse still succeeds (the old `<normalized-timestamp>` placeholder was
// not valid JSON, which forced a purely textual comparison).
const normalizeTimestamps = (content: string): string =>
  content.replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z/g, '0000-01-01T00:00:00.000Z');

// Compare generated content to the checked-in artifact.
// - For JSON files, parse both sides and compare by structural equality so
//   whitespace/formatting differences (e.g. after a biome format pass) do not
//   register as drift. HTML files fall back to text comparison with timestamps
//   normalized away.
const normalizeForCheck = (path: string, content: string): string => {
  const withoutTimestamps = normalizeTimestamps(content);
  if (path.endsWith('.json')) {
    try {
      return JSON.stringify(JSON.parse(withoutTimestamps));
    } catch {
      return withoutTimestamps;
    }
  }
  return withoutTimestamps;
};

const loadValueWithFallback = async (
  packageDir: string,
  pointer: PieDocsSourcePointer,
  kind: 'pie' | 'config'
): Promise<{ value: unknown; sourceLabel: string }> => {
  const fallbackPointers: PieDocsSourcePointer[] =
    kind === 'pie'
      ? [
          pointer,
          { file: 'src/controller/defaults.ts', path: 'model' },
          { file: 'src/controller/defaults.ts' },
        ]
      : [
          pointer,
          { file: 'src/author/defaultConfiguration.ts', path: 'configuration' },
          { file: 'src/author/defaults.ts', path: 'configuration' },
          { file: 'src/author/defaults.tsx', path: 'configuration' },
          { file: 'src/controller/defaults.ts', path: 'configuration' },
        ];

  let lastError: Error | undefined;
  for (const candidate of fallbackPointers) {
    if (!existsSync(join(packageDir, candidate.file))) {
      continue;
    }
    try {
      const value = await loadPointerValue(packageDir, candidate);
      return {
        value,
        sourceLabel: candidate.file + (candidate.path ? `#${candidate.path}` : ''),
      };
    } catch (error) {
      lastError = error as Error;
    }
  }

  if (kind === 'config') {
    return { value: {}, sourceLabel: pointer.file + (pointer.path ? `#${pointer.path}` : '') };
  }

  throw lastError || new Error(`Unable to load ${kind} defaults from ${pointer.file}`);
};

interface ResolvedViewDocs {
  view: string;
  pieDocs: PieDocsSchemaDocs;
  configDocs: PieDocsSchemaDocs;
  pieSource: string;
  configSource: string;
}

const propertyFingerprint = (properties: PieDocsProperty[]): string =>
  JSON.stringify(
    properties.map((p) => ({
      path: p.path,
      type: p.type,
      required: p.required,
      defaultValue: p.defaultValue,
    }))
  );

// A type label names a documented type by its definition name; link those names to it.
const renderType = (type: string, anchor: (name: string) => string | undefined): string =>
  type
    .split(' | ')
    .map((member) => {
      const id = anchor(member);
      const code = `<code>${escapeHtml(member)}</code>`;
      return id ? `<a href="#${id}">${code}</a>` : code;
    })
    .join(' | ');

const renderPropertyHtml = (
  prop: PieDocsProperty,
  heading: 'h3' | 'h4',
  anchor: (name: string) => string | undefined
): string => {
  const rows: string[] = [];
  rows.push(`<li><strong>Type:</strong> ${renderType(prop.type, anchor)}</li>`);
  rows.push(`<li><strong>Required:</strong> <code>${String(prop.required)}</code></li>`);
  if (prop.itemType) {
    rows.push(`<li><strong>Item Type:</strong> ${renderType(prop.itemType, anchor)}</li>`);
  }
  if (prop.description) {
    rows.push(`<li><strong>Description:</strong> ${escapeHtml(prop.description)}</li>`);
  }
  if (prop.enum && prop.enum.length > 0) {
    rows.push(
      `<li><strong>Allowed values:</strong> ${prop.enum
        .map((v) => `<code>${escapeHtml(formatInline(v))}</code>`)
        .join(', ')}</li>`
    );
  }
  const constraints: string[] = [];
  if (prop.minimum !== undefined) constraints.push(`<code>minimum: ${prop.minimum}</code>`);
  if (prop.maximum !== undefined) constraints.push(`<code>maximum: ${prop.maximum}</code>`);
  if (prop.minLength !== undefined) constraints.push(`<code>minLength: ${prop.minLength}</code>`);
  if (prop.maxLength !== undefined) constraints.push(`<code>maxLength: ${prop.maxLength}</code>`);
  if (prop.pattern) constraints.push(`<code>pattern: ${escapeHtml(prop.pattern)}</code>`);
  if (constraints.length) {
    rows.push(`<li><strong>Constraints:</strong> ${constraints.join(', ')}</li>`);
  }
  rows.push(
    `<li><strong>Default:</strong> ${
      prop.defaultValue !== undefined ? formatValue(prop.defaultValue) : '<em>none</em>'
    }</li>`
  );

  return `
  <section class="doc-property">
    <${heading}><code>${escapeHtml(prop.path)}</code></${heading}>
    <ul>
      ${rows.join('\n      ')}
    </ul>
  </section>`;
};

const renderPropertiesSectionHtml = (opts: {
  title: string;
  schema?: string;
  defaults?: string;
  docs: PieDocsSchemaDocs;
}): string => {
  const sources = [
    opts.schema && `<strong>Schema:</strong> <code>${escapeHtml(opts.schema)}</code>`,
    opts.defaults && `<strong>Defaults:</strong> <code>${escapeHtml(opts.defaults)}</code>`,
  ].filter(Boolean);
  // Each schema carries its own definitions, so anchors are scoped to the section.
  const prefix = opts.title.toLowerCase();
  const names = new Set(opts.docs.definitions.map((definition) => definition.name));
  const anchor = (name: string) =>
    names.has(name) ? `${prefix}-${encodeURIComponent(name)}` : undefined;
  const body =
    opts.docs.properties.length > 0
      ? opts.docs.properties.map((prop) => renderPropertyHtml(prop, 'h3', anchor)).join('\n')
      : '<p>No properties found.</p>';
  const definitions = opts.docs.definitions
    .map(
      (definition) => `
    <section class="doc-definition" id="${anchor(definition.name)}">
      <h3>Type <code>${escapeHtml(definition.name)}</code></h3>
      ${definition.description ? `<p>${escapeHtml(definition.description)}</p>` : ''}
      ${definition.properties.map((prop) => renderPropertyHtml(prop, 'h4', anchor)).join('\n')}
    </section>`
    )
    .join('\n');

  return `
  <section class="doc-section">
    <h2>${escapeHtml(opts.title)}</h2>
    ${sources.length > 0 ? `<p>${sources.join(' · ')}</p>` : ''}
    ${body}
    ${definitions}
  </section>`;
};

const wrapHtmlPage = (title: string, body: string): string => `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      :root { color-scheme: light dark; font-family: Inter, system-ui, sans-serif; }
      body { margin: 0; padding: 1.5rem; line-height: 1.55; }
      h1,h2,h3 { line-height: 1.25; }
      h1 { margin-top: 0; }
      code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
      .doc-section { margin-bottom: 2rem; }
      .doc-property { margin: 0 0 1.25rem 0; padding-bottom: 0.5rem; border-bottom: 1px solid rgba(128,128,128,.25); }
      .doc-definition { margin: 1.5rem 0 0 0; padding-left: 1rem; border-left: 3px solid rgba(128,128,128,.35); }
      ul { padding-left: 1.25rem; }
      .meta-list li { margin-bottom: .25rem; }
    </style>
  </head>
  <body>
    ${body}
  </body>
</html>
`;

const renderElementIndexHtml = (opts: {
  contract: PieDocsContract;
  summary: string;
  generatedAt: string;
  emittedViews: string[];
}): string =>
  wrapHtmlPage(
    `${opts.contract.elementName} docs`,
    `
    <h1>${escapeHtml(opts.contract.elementName)} docs</h1>
    <section class="doc-section">
      <h2>Overview</h2>
      <p>${escapeHtml(opts.summary)}</p>
    </section>
    <section class="doc-section">
      <h2>Element Metadata</h2>
      <ul class="meta-list">
        <li><strong>Element:</strong> <code>${escapeHtml(opts.contract.elementName)}</code></li>
        <li><strong>Package:</strong> <code>${escapeHtml(opts.contract.packageName)}</code></li>
        <li><strong>Framework:</strong> <code>${escapeHtml(opts.contract.framework)}</code></li>
        <li><strong>Generated:</strong> <code>${escapeHtml(opts.generatedAt)}</code></li>
      </ul>
    </section>
    <section class="doc-section">
      <h2>Supported Modes</h2>
      <ul class="meta-list">
        ${(opts.contract.supportedModes || []).map((mode) => `<li>${escapeHtml(mode)}</li>`).join('')}
      </ul>
    </section>
    <section class="doc-section">
      <h2>Views</h2>
      <ul class="meta-list">
        ${opts.emittedViews
          .map(
            (view) =>
              `<li><a href="./${encodeURIComponent(view)}.html">${escapeHtml(view)}</a></li>`
          )
          .join('')}
      </ul>
    </section>
  `
  );

const schemaSpecifier = (contract: PieDocsContract, kind: SchemaKind) =>
  `${contract.packageName}/schemas/${kind}.schema.json`;

const renderViewHtml = (opts: {
  contract: PieDocsContract;
  view: ResolvedViewDocs;
  kinds: SchemaKind[];
  sessionDocs: PieDocsSchemaDocs;
}): string =>
  wrapHtmlPage(
    `${opts.contract.elementName} ${opts.view.view} docs`,
    `
    <h1>${escapeHtml(opts.contract.elementName)} / ${escapeHtml(opts.view.view)}</h1>
    ${renderPropertiesSectionHtml({
      title: 'Model',
      schema: schemaSpecifier(opts.contract, 'model'),
      defaults: opts.view.pieSource,
      docs: opts.view.pieDocs,
    })}
    ${
      opts.kinds.includes('configuration')
        ? renderPropertiesSectionHtml({
            title: 'Configuration',
            schema: schemaSpecifier(opts.contract, 'configuration'),
            defaults: opts.view.configSource,
            docs: opts.view.configDocs,
          })
        : ''
    }
    ${renderPropertiesSectionHtml({
      title: 'Session',
      schema: schemaSpecifier(opts.contract, 'session'),
      docs: opts.sessionDocs,
    })}
  `
  );

const chooseViewDocs = (resolvedViews: ResolvedViewDocs[]): ResolvedViewDocs[] => {
  const map = new Map(resolvedViews.map((v) => [v.view, v]));
  const chosen: ResolvedViewDocs[] = [];

  const delivery = map.get('delivery');
  const author = map.get('author');
  const print = map.get('print');

  if (delivery) {
    chosen.push(delivery);
  }
  if (author) {
    chosen.push(author);
  }

  if (print) {
    const deliveryFingerprint = delivery
      ? `${propertyFingerprint(delivery.pieDocs.properties)}|${propertyFingerprint(delivery.configDocs.properties)}`
      : '';
    const printFingerprint = `${propertyFingerprint(print.pieDocs.properties)}|${propertyFingerprint(print.configDocs.properties)}`;
    const sourceDiffFromDelivery = delivery
      ? print.pieSource !== delivery.pieSource || print.configSource !== delivery.configSource
      : true;
    const sourceDiffFromAuthor = author
      ? print.pieSource !== author.pieSource || print.configSource !== author.configSource
      : true;
    const materiallyDifferent = !delivery || printFingerprint !== deliveryFingerprint;
    if (materiallyDifferent || sourceDiffFromDelivery || sourceDiffFromAuthor) {
      chosen.push(print);
    }
  }

  const extras = resolvedViews
    .filter((v) => !['delivery', 'author', 'print'].includes(v.view))
    .sort((a, b) => a.view.localeCompare(b.view));
  for (const extra of extras) {
    chosen.push(extra);
  }

  return chosen;
};

export const generateDocsForContract = async (
  packageDir: string,
  contract: PieDocsContract,
  options: GenerateDocsOptions
): Promise<GenerateDocsResult> => {
  const generatedAt = new Date().toISOString();
  const summary = await readSummary(packageDir, contract.summary);
  const filesWritten: string[] = [];
  const filesChecked: string[] = [];
  const driftFiles: string[] = [];
  const sourcesUsed = new Set<string>();

  const outputs: PieDocsElementOutput = {
    contract,
    packageDir,
    generatedAt,
    views: [],
    sourcesUsed: [],
  };

  // Property rows come from the schemas the package publishes, generated here from source so the
  // docs do not depend on the element having been built.
  const schemas = generateElementSchemas(packageDir);
  if (!schemas.model || !schemas.session) {
    throw new Error(`${contract.packageName} publishes no model or session schema to document`);
  }
  const kinds = Object.keys(schemas) as SchemaKind[];
  const sessionDocs = schemaDocs(schemas.session);

  const resolvedViews: ResolvedViewDocs[] = [];
  for (const view of contract.views) {
    const pieResolved = await loadValueWithFallback(packageDir, view.pie, 'pie');
    const configResolved = await loadValueWithFallback(packageDir, view.config, 'config');
    resolvedViews.push({
      view: view.view,
      pieDocs: schemaDocs(schemas.model, pieResolved.value),
      configDocs: schemaDocs(schemas.configuration, configResolved.value),
      pieSource: pieResolved.sourceLabel,
      configSource: configResolved.sourceLabel,
    });
  }

  const emittedViews = chooseViewDocs(resolvedViews);
  const elementOutputDir = join(options.outputDir, contract.elementName);
  const elementIndexPath = join(elementOutputDir, 'index.html');
  const elementIndexContent = renderElementIndexHtml({
    contract,
    summary,
    generatedAt,
    emittedViews: emittedViews.map((v) => v.view),
  });

  const manifest = {
    elementName: contract.elementName,
    packageName: contract.packageName,
    framework: contract.framework,
    generatedAt,
    summary,
    supportedModes: contract.supportedModes || [],
    views: emittedViews.map((view) => ({
      id: view.view,
      file: `${view.view}.html`,
      pieSource: view.pieSource,
      configSource: view.configSource,
      hasModelDefaults: view.pieDocs.properties.length > 0,
      hasConfigDefaults: view.configDocs.properties.length > 0,
    })),
  };

  const candidates: Array<{ path: string; content: string }> = [
    { path: elementIndexPath, content: elementIndexContent },
    {
      path: join(elementOutputDir, 'manifest.json'),
      content: `${JSON.stringify(manifest, null, 2)}\n`,
    },
    ...emittedViews.map((view) => ({
      path: join(elementOutputDir, `${view.view}.html`),
      content: renderViewHtml({ contract, view, kinds, sessionDocs }),
    })),
  ];

  for (const candidate of candidates) {
    filesChecked.push(candidate.path);
    if (options.check) {
      const existing = existsSync(candidate.path) ? await readFile(candidate.path, 'utf-8') : null;
      if (
        existing === null ||
        normalizeForCheck(candidate.path, existing) !==
          normalizeForCheck(candidate.path, candidate.content)
      ) {
        driftFiles.push(candidate.path);
      }
      continue;
    }

    if (!options.dryRun) {
      await mkdir(elementOutputDir, { recursive: true });
      await writeFile(candidate.path, candidate.content, 'utf-8');
    }
    filesWritten.push(candidate.path);
  }

  for (const view of emittedViews) {
    sourcesUsed.add(view.pieSource);
    sourcesUsed.add(view.configSource);
    outputs.views.push({
      view: view.view,
      pieProperties: view.pieDocs.properties,
      configProperties: view.configDocs.properties,
    });
  }

  outputs.sourcesUsed = Array.from(sourcesUsed).sort();

  return {
    filesWritten,
    filesChecked,
    driftFiles,
    outputs: [outputs],
  };
};

export const toRelativePaths = (rootDir: string, paths: string[]): string[] =>
  paths.map((p) => relative(rootDir, p)).sort();
