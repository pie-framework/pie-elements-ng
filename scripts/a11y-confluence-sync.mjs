#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, '..');
const mapPath = join(repoRoot, 'docs/a11y/confluence-map.json');
const statusPath = join(repoRoot, 'docs/a11y/confluence-status.json');

const START_MARKER = '<!-- pie-a11y-sync:start repo-summary -->';
const END_MARKER = '<!-- pie-a11y-sync:end repo-summary -->';
const PM_START_MARKER = '<!-- pie-a11y-sync:start pm-status -->';
const PM_END_MARKER = '<!-- pie-a11y-sync:end pm-status -->';
const ESCAPED_START_MARKER = '&lt;!-- pie-a11y-sync:start repo-summary --&gt;';
const ESCAPED_END_MARKER = '&lt;!-- pie-a11y-sync:end repo-summary --&gt;';
const ESCAPED_PM_START_MARKER = '&lt;!-- pie-a11y-sync:start pm-status --&gt;';
const ESCAPED_PM_END_MARKER = '&lt;!-- pie-a11y-sync:end pm-status --&gt;';

const groupDefinitions = {
  'group-1a': {
    summary: 'MC/MS, EBSR, and Passages for Group 1A validation.',
    elements: ['multiple-choice', 'ebsr', 'passage'],
    sharedSurfaces: [],
  },
  'group-1b': {
    summary: 'Inline Dropdown, ECR, and CQT populated blank variants for Group 1B scope.',
    elements: ['inline-dropdown', 'explicit-constructed-response', 'mc-populated-blank'],
    sharedSurfaces: [],
  },
  'group-2': {
    summary: 'Drag, spatial, and image-heavy elements targeted by the Group 2 audit.',
    elements: [
      'match-list',
      'drag-in-the-blank',
      'categorize',
      'placement-ordering',
      'image-cloze-association',
      'hotspot',
    ],
    sharedSurfaces: ['@pie-lib/drag', '@pie-lib/mask-markup'],
  },
  'group-1c': {
    summary: 'Math editor and math-inline work, including shared math input surfaces.',
    elements: ['math-inline', 'math-templated'],
    sharedSurfaces: ['@pie-lib/math-input', '@pie-lib/math-toolbar', '@pie-lib/math-input-svelte'],
  },
  'group-1d': {
    summary: 'Constructed response and extended text entry editor work.',
    elements: ['extended-text-entry', 'explicit-constructed-response'],
    sharedSurfaces: ['@pie-lib/editable-html-tip-tap'],
  },
  'group-3': {
    summary: 'Math, graphing, drawing, and visual interaction elements for Group 3 scoping.',
    elements: [
      'graphing',
      'number-line',
      'matrix',
      'select-text',
      'charting',
      'drawing-response',
      'math-templated',
      'graphing-solution-set',
      'fraction-model',
    ],
    sharedSurfaces: ['@pie-lib/graphing', '@pie-lib/charting', '@pie-lib/plot'],
  },
};

function loadDotEnv() {
  const envPath = join(repoRoot, '.env');
  if (!existsSync(envPath)) {
    return;
  }

  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const separator = trimmed.indexOf('=');
    if (separator === -1) {
      continue;
    }
    const key = trimmed
      .slice(0, separator)
      .trim()
      .replace(/^export\s+/, '');
    const value = trimmed
      .slice(separator + 1)
      .trim()
      .replace(/^['"]|['"]$/g, '');
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function parseArgs() {
  const [, , command = 'check', ...rest] = process.argv;
  const apply = rest.includes('--apply');
  const dryRun = !apply || rest.includes('--dry-run');
  return { command, apply, dryRun };
}

function requireAuth(map) {
  loadDotEnv();
  const siteUrl = process.env.ATLASSIAN_SITE_URL || map.siteUrl;
  const token = process.env.ATLASSIAN_API_TOKEN;
  const authMode = process.env.ATLASSIAN_AUTH_MODE || 'basic';

  if (!token) {
    throw new Error('Missing required environment variable: ATLASSIAN_API_TOKEN');
  }

  if (authMode === 'bearer') {
    return {
      siteUrl,
      headers: { Authorization: `Bearer ${token}` },
    };
  }

  const email = process.env.ATLASSIAN_EMAIL || process.env.ATLASSIAN_API_EMAIL;
  if (!email) {
    throw new Error(
      'Missing required environment variable: ATLASSIAN_EMAIL for Basic auth. Set ATLASSIAN_AUTH_MODE=bearer to use a bearer token.'
    );
  }

  return {
    siteUrl,
    headers: {
      Authorization: `Basic ${Buffer.from(`${email}:${token}`).toString('base64')}`,
    },
  };
}

async function confluenceFetch(map, apiPath, options = {}) {
  const auth = requireAuth(map);
  const response = await fetch(`${auth.siteUrl}${apiPath}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...auth.headers,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Confluence request failed (${response.status}) for ${apiPath}: ${body}`);
  }

  if (response.status === 204) {
    return undefined;
  }

  return response.json();
}

async function getChildren(map, pageId) {
  const result = await confluenceFetch(map, `/wiki/api/v2/pages/${pageId}/children?limit=250`);
  return result.results ?? [];
}

async function getPage(map, pageId) {
  return confluenceFetch(map, `/wiki/api/v2/pages/${pageId}?body-format=storage`);
}

async function createPage(map, page, body) {
  return confluenceFetch(map, '/wiki/api/v2/pages', {
    method: 'POST',
    body: JSON.stringify({
      spaceId: map.spaceId,
      status: 'current',
      title: page.title,
      parentId: parentPageId(map, page),
      body: {
        representation: 'storage',
        value: body,
      },
    }),
  });
}

async function updatePage(map, page, currentPage, body) {
  return confluenceFetch(map, `/wiki/api/v2/pages/${page.pageId}`, {
    method: 'PUT',
    body: JSON.stringify({
      id: page.pageId,
      spaceId: map.spaceId,
      status: 'current',
      title: page.title,
      parentId: parentPageId(map, page),
      version: {
        number: currentPage.version.number + 1,
        message: 'Sync PIE a11y repo-managed summary',
      },
      body: {
        representation: 'storage',
        value: body,
      },
    }),
  });
}

function parentPageId(map, page) {
  if (!page.parentSlug) {
    return map.rootPageId;
  }
  const parent = map.pages.find((candidate) => candidate.slug === page.parentSlug);
  if (!parent?.pageId) {
    throw new Error(`Missing parent page ID for ${page.slug}: ${page.parentSlug}`);
  }
  return parent.pageId;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inlineMarkdown(value) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, href) => {
      const safeHref = href.startsWith('http')
        ? href
        : `https://github.com/pie-framework/pie-elements-ng/blob/develop/${href.replace(/^\.\//, '')}`;
      return `<a href="${escapeHtml(safeHref)}">${escapeHtml(label)}</a>`;
    });
}

function markdownToHtml(markdown) {
  const lines = markdown.split(/\r?\n/);
  const html = [];
  let inList = false;
  let inCode = false;
  let paragraph = [];

  function flushParagraph() {
    if (paragraph.length > 0) {
      html.push(`<p>${inlineMarkdown(paragraph.join(' '))}</p>`);
      paragraph = [];
    }
  }

  function closeList() {
    if (inList) {
      html.push('</ul>');
      inList = false;
    }
  }

  for (const line of lines) {
    if (line.startsWith('```')) {
      flushParagraph();
      closeList();
      if (inCode) {
        html.push('</code></pre>');
      } else {
        html.push('<pre><code>');
      }
      inCode = !inCode;
      continue;
    }

    if (inCode) {
      html.push(escapeHtml(line));
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      closeList();
      continue;
    }

    const heading = /^(#{1,4})\s+(.+)$/.exec(line);
    if (heading) {
      flushParagraph();
      closeList();
      const level = Math.min(heading[1].length + 1, 5);
      html.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }

    if (line.startsWith('- ')) {
      flushParagraph();
      if (!inList) {
        html.push('<ul>');
        inList = true;
      }
      html.push(`<li>${inlineMarkdown(line.slice(2))}</li>`);
      continue;
    }

    if (line.startsWith('|')) {
      flushParagraph();
      closeList();
      html.push(`<p><code>${escapeHtml(line)}</code></p>`);
      continue;
    }

    paragraph.push(line.trim());
  }

  flushParagraph();
  closeList();
  return html.join('\n');
}

function readLocalMarkdown(path) {
  return readFileSync(join(repoRoot, path), 'utf8');
}

function managedBody(contentHtml) {
  return [
    '<div data-type="panel-note"><p><strong>Synced from pie-elements-ng.</strong> Edit repo-managed content in the repo. Use the PM status block below for Confluence-owned notes.</p></div>',
    START_MARKER,
    contentHtml,
    END_MARKER,
    '<h2>PM Status</h2>',
    PM_START_MARKER,
    '<table><tbody><tr><th>Status</th><td>TBD</td></tr><tr><th>Priority</th><td>TBD</td></tr><tr><th>Jira</th><td>TBD</td></tr><tr><th>Notes</th><td>TBD</td></tr></tbody></table>',
    PM_END_MARKER,
  ].join('\n');
}

function renderPage(page) {
  if (page.sync === 'generated-group-summary') {
    return managedBody(renderGroupSummary(page.slug));
  }

  if (page.sync === 'generated-prd-index') {
    return managedBody(renderPrdIndex());
  }

  const localMarkdown = readLocalMarkdown(page.localPath);
  return managedBody(markdownToHtml(localMarkdown));
}

function renderGroupSummary(slug) {
  const group = groupDefinitions[slug];
  if (!group) {
    throw new Error(`No group definition for ${slug}`);
  }

  const rows = group.elements
    .map((element) => {
      const path = `docs/a11y/${element}.md`;
      return `<tr><td><code>${element}</code></td><td><a href="https://github.com/pie-framework/pie-elements-ng/blob/develop/${path}">${path}</a></td><td>TBD</td><td>TBD</td><td>TBD</td></tr>`;
    })
    .join('\n');

  const sharedRows = group.sharedSurfaces
    .map((surface) => `<li><code>${escapeHtml(surface)}</code></li>`)
    .join('\n');

  return [
    `<p>${escapeHtml(group.summary)}</p>`,
    '<h2>Repo Elements</h2>',
    '<table><thead><tr><th>Element</th><th>Repo doc</th><th>Jira</th><th>Effort</th><th>Validation</th></tr></thead><tbody>',
    rows,
    '</tbody></table>',
    group.sharedSurfaces.length > 0 ? '<h2>Shared Surfaces</h2>' : '',
    group.sharedSurfaces.length > 0 ? `<ul>${sharedRows}</ul>` : '',
    '<h2>Sync Notes</h2>',
    '<p>Scenario details and automated/manual boundaries are maintained in the linked repo docs and the a11y scenario catalog.</p>',
  ].join('\n');
}

function renderPrdIndex() {
  const prdRoot = join(repoRoot, 'docs/prds');
  const rows = readdirSync(prdRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const prdPath = join(prdRoot, entry.name, 'PRD.md');
      if (!existsSync(prdPath)) {
        return undefined;
      }
      const markdown = readFileSync(prdPath, 'utf8');
      const title = /^#\s+(.+)$/m.exec(markdown)?.[1] ?? entry.name;
      const status = /^Status:\s+(.+)$/m.exec(markdown)?.[1] ?? 'Unknown';
      const relativePath = relative(repoRoot, prdPath);
      return `<tr><td>${escapeHtml(title)}</td><td>${inlineMarkdown(status)}</td><td><a href="https://github.com/pie-framework/pie-elements-ng/blob/develop/${relativePath}">${relativePath}</a></td><td>TBD</td></tr>`;
    })
    .filter(Boolean)
    .join('\n');

  return [
    '<p>This index publishes repo PRDs for stakeholder discovery. The PRD file in the repo remains the canonical product contract.</p>',
    '<table><thead><tr><th>PRD</th><th>Status</th><th>Repo path</th><th>Jira</th></tr></thead><tbody>',
    rows || '<tr><td colspan="4">No PRDs found.</td></tr>',
    '</tbody></table>',
  ].join('\n');
}

function replaceManagedSection(existingBody, nextManagedBody) {
  const nextStart = nextManagedBody.indexOf(START_MARKER);
  const nextEnd = nextManagedBody.indexOf(END_MARKER);
  const existingStart = locateMarker(existingBody, START_MARKER, ESCAPED_START_MARKER);
  const existingEnd = locateMarker(existingBody, END_MARKER, ESCAPED_END_MARKER);

  if (nextStart === -1 || nextEnd === -1) {
    throw new Error('Generated body is missing repo managed markers');
  }
  if (!existingStart || !existingEnd) {
    throw new Error(
      'Existing Confluence page is missing repo managed markers; refusing to overwrite'
    );
  }
  if (
    !hasMarker(existingBody, PM_START_MARKER, ESCAPED_PM_START_MARKER) ||
    !hasMarker(existingBody, PM_END_MARKER, ESCAPED_PM_END_MARKER)
  ) {
    throw new Error('Existing Confluence page is missing PM status markers; refusing to overwrite');
  }

  const nextSection = nextManagedBody.slice(nextStart, nextEnd + END_MARKER.length);
  const replaceStart = expandEscapedStart(existingBody, existingStart);
  const replaceEnd = expandEscapedEnd(existingBody, existingEnd);
  return `${existingBody.slice(0, replaceStart)}${nextSection}${existingBody.slice(replaceEnd)}`;
}

function markerIndex(body, marker, escapedMarker) {
  return locateMarker(body, marker, escapedMarker)?.index ?? -1;
}

function hasMarker(body, marker, escapedMarker) {
  return markerIndex(body, marker, escapedMarker) !== -1;
}

function locateMarker(body, marker, escapedMarker) {
  const index = body.indexOf(marker);
  if (index !== -1) {
    return { index, marker, escaped: false };
  }

  const escapedIndex = body.indexOf(escapedMarker);
  return escapedIndex === -1
    ? undefined
    : { index: escapedIndex, marker: escapedMarker, escaped: true };
}

function expandEscapedStart(body, match) {
  if (!match.escaped) {
    return match.index;
  }

  const paragraphStart = body.lastIndexOf('<p>', match.index);
  const previousParagraphEnd = body.lastIndexOf('</p>', match.index);
  return paragraphStart > previousParagraphEnd ? paragraphStart : match.index;
}

function expandEscapedEnd(body, match) {
  const markerEnd = match.index + match.marker.length;
  if (!match.escaped) {
    return markerEnd;
  }

  const paragraphEnd = body.indexOf('</p>', markerEnd);
  return paragraphEnd === -1 ? markerEnd : paragraphEnd + '</p>'.length;
}

async function discoverMappedChildren(map) {
  const children = await getChildren(map, map.rootPageId);
  const byTitle = new Map(children.map((child) => [child.title, child]));
  let changed = false;

  for (const page of map.pages) {
    const existing = byTitle.get(page.title);
    if (existing && page.pageId !== existing.id) {
      page.pageId = existing.id;
      changed = true;
    }
  }

  return { children, changed };
}

async function checkCommand(map) {
  const missingLocal = map.pages.filter(
    (page) => page.localPath && !existsSync(join(repoRoot, page.localPath))
  );
  for (const page of missingLocal) {
    console.log(`Missing local path for ${page.slug}: ${page.localPath}`);
  }

  try {
    const { changed } = await discoverMappedChildren(map);
    const missingRemote = map.pages.filter((page) => !page.pageId);
    if (changed) {
      console.log(
        'Confluence map has stale or missing page IDs; run bootstrap -- --apply to update it.'
      );
    }
    if (missingRemote.length === 0) {
      console.log('All mapped Confluence pages have IDs.');
    } else {
      console.log(
        `Missing Confluence pages: ${missingRemote.map((page) => page.title).join(', ')}`
      );
    }
  } catch (error) {
    console.log(`Confluence check skipped or failed: ${error.message}`);
  }
}

async function bootstrapCommand(map, { apply }) {
  let changed = false;
  try {
    ({ changed } = await discoverMappedChildren(map));
  } catch (error) {
    if (apply) {
      throw error;
    }
    console.log(`Confluence discovery skipped: ${error.message}`);
  }
  let wroteMap = false;

  for (const page of map.pages) {
    if (page.pageId) {
      console.log(`Found ${page.title}: ${page.pageId}`);
      continue;
    }

    if (!apply) {
      console.log(`[dry-run] Would create ${page.title}`);
      continue;
    }

    const created = await createPage(map, page, renderPage(page));
    page.pageId = created.id;
    wroteMap = true;
    console.log(`Created ${page.title}: ${page.pageId}`);
  }

  if (apply && (changed || wroteMap)) {
    writeJson(mapPath, map);
    console.log(`Updated ${relative(repoRoot, mapPath)}`);
  }
}

async function pushCommand(map, { apply }) {
  await discoverMappedChildren(map);
  const missing = map.pages.filter((page) => !page.pageId);
  if (missing.length > 0) {
    throw new Error(
      `Missing page IDs. Run bootstrap first: ${missing.map((page) => page.slug).join(', ')}`
    );
  }

  for (const page of map.pages) {
    const nextBody = renderPage(page);
    const current = await getPage(map, page.pageId);
    const currentBody = current.body?.storage?.value ?? '';
    const body = replaceManagedSection(currentBody, nextBody);

    if (!apply) {
      console.log(`[dry-run] Would update ${page.title}`);
      continue;
    }

    await updatePage(map, page, current, body);
    console.log(`Updated ${page.title}`);
  }
}

async function pullStatusCommand(map, { apply }) {
  await discoverMappedChildren(map);
  const statuses = [];

  for (const page of map.pages.filter((candidate) => candidate.pageId)) {
    const current = await getPage(map, page.pageId);
    const body = current.body?.storage?.value ?? '';
    const start = markerIndex(body, PM_START_MARKER, ESCAPED_PM_START_MARKER);
    const end = markerIndex(body, PM_END_MARKER, ESCAPED_PM_END_MARKER);
    if (start === -1 || end === -1) {
      console.log(`Skipping ${page.title}: PM status markers missing`);
      continue;
    }
    const startMarker = body.startsWith(PM_START_MARKER, start)
      ? PM_START_MARKER
      : ESCAPED_PM_START_MARKER;

    statuses.push({
      slug: page.slug,
      title: page.title,
      pageId: page.pageId,
      statusBlockHtml: body.slice(start + startMarker.length, end).trim(),
    });
  }

  if (!apply) {
    console.log(
      `[dry-run] Would write ${relative(repoRoot, statusPath)} with ${statuses.length} status blocks`
    );
    return;
  }

  writeJson(statusPath, {
    generatedAt: new Date().toISOString(),
    statuses,
  });
  console.log(`Updated ${relative(repoRoot, statusPath)}`);
}

async function main() {
  const args = parseArgs();
  const map = readJson(mapPath);

  if (args.command === 'check' || args.command === 'dry-run') {
    await checkCommand(map);
  } else if (args.command === 'bootstrap') {
    await bootstrapCommand(map, args);
  } else if (args.command === 'push') {
    await pushCommand(map, args);
  } else if (args.command === 'pull-status') {
    await pullStatusCommand(map, args);
  } else {
    throw new Error(`Unknown command: ${args.command}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
