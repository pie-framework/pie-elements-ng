import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { Plugin } from 'vite';

/**
 * The notices file of a build: `THIRD_PARTY_LICENSES.txt` at the root of a build that emits several
 * chunks, `<chunk>.THIRD_PARTY_LICENSES.txt` beside the one chunk of a single-file build (several
 * single-file lanes share `dist`). `scripts/check-third-party-notices.mjs` resolves it the same way.
 */
export const NOTICES_FILE = 'THIRD_PARTY_LICENSES.txt';

const RULE = '='.repeat(80);
const HEADING = /^={80}\n(?=[^\n]+@[^\n]+\nLicense: )/m;
const LICENSE_FILE = /^(?:licen[cs]e|copying|notice)(?:[.-]|$)/i;

type Notice = { key: string; text: string };

/** The root directory of the installed package that `file` belongs to, or null for first-party code. */
export const installedPackageRoot = (file: string): string | null => {
  const at = file.lastIndexOf('/node_modules/');
  if (at < 0) return null;
  const base = at + '/node_modules/'.length;
  const segments = file.slice(base).split('/');
  const name = segments[0].startsWith('@') ? `${segments[0]}/${segments[1]}` : segments[0];
  return file.slice(0, base) + name;
};

const licenseOf = (manifest: { license?: unknown; licenses?: unknown }): string => {
  const { license, licenses } = manifest;
  if (typeof license === 'string') return license;
  if (license && typeof license === 'object' && 'type' in license) return String(license.type);
  if (Array.isArray(licenses)) return licenses.map((l) => l?.type ?? l).join(' OR ');
  return 'UNKNOWN';
};

const authorOf = (author: unknown): string | null => {
  if (typeof author === 'string') return author;
  if (author && typeof author === 'object' && 'name' in author) return String(author.name);
  return null;
};

const noticeOf = (root: string): Notice => {
  const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf-8'));
  const key = `${manifest.name}@${manifest.version}`;
  const license = licenseOf(manifest);
  const texts = readdirSync(root)
    .filter((file) => LICENSE_FILE.test(file))
    .sort()
    .map((file) => readFileSync(join(root, file), 'utf-8').trim());
  const author = authorOf(manifest.author);
  const body =
    texts.length > 0
      ? texts.join('\n\n')
      : `${manifest.name} ships no license file. Its package.json declares ${license}${author ? ` and names ${author} as author` : ''}.`;
  return { key, text: `${RULE}\n${key}\nLicense: ${license}\n${'-'.repeat(80)}\n${body}\n` };
};

const parseNotices = (text: string): Notice[] =>
  text
    .split(HEADING)
    .slice(1)
    .map((block) => ({
      key: block.slice(0, block.indexOf('\n')),
      text: `${RULE}\n${block.trimEnd()}\n`,
    }));

/** The names of the packages a notices file lists. */
export const noticedPackageNames = (text: string): Set<string> =>
  new Set(parseNotices(text).map(({ key }) => key.slice(0, key.lastIndexOf('@'))));

/**
 * The notices file covering `file`, a file of some package's build output: the one beside it, else
 * the nearest in a parent directory up to its package root. `byDir` memoises the directory walk
 * across the files of one build.
 */
export const noticesCovering = (
  file: string,
  byDir = new Map<string, string | null>()
): string | null => {
  const sibling = file.replace(/\.[cm]?js$/, `.${NOTICES_FILE}`);
  if (sibling !== file && existsSync(sibling)) return sibling;
  const walked: string[] = [];
  let found: string | null = null;
  for (let dir = dirname(file); dir !== dirname(dir); dir = dirname(dir)) {
    if (byDir.has(dir)) {
      found = byDir.get(dir) ?? null;
      break;
    }
    walked.push(dir);
    const candidate = join(dir, NOTICES_FILE);
    if (existsSync(candidate)) {
      found = candidate;
      break;
    }
    if (existsSync(join(dir, 'package.json'))) break;
  }
  for (const dir of walked) byDir.set(dir, found);
  return found;
};

/**
 * The notices for code taken from `files`: each installed package's license files, and the notices
 * of any other workspace package's build output that `files` bundles. `text` is null when every
 * file is first-party. `unattributed` lists the files copied out of an installed package (another
 * build's `dist/node_modules/...`) that no notices file covers.
 */
export const thirdPartyNotices = (
  files: Iterable<string>
): { text: string | null; unattributed: string[] } => {
  const notices = new Map<string, string>();
  const roots = new Set<string>();
  const covering = new Set<string>();
  const unattributed: string[] = [];
  const installed = new Map<string, boolean>();
  const byDir = new Map<string, string | null>();
  for (const file of files) {
    const root = installedPackageRoot(file);
    if (root && !installed.has(root)) installed.set(root, existsSync(join(root, 'package.json')));
    if (root && installed.get(root)) {
      roots.add(root);
      continue;
    }
    const path = noticesCovering(file, byDir);
    if (path) covering.add(path);
    else if (root) unattributed.push(file);
  }
  for (const root of roots) {
    const notice = noticeOf(root);
    notices.set(notice.key, notice.text);
  }
  for (const path of covering) {
    for (const notice of parseNotices(readFileSync(path, 'utf-8')))
      notices.set(notice.key, notice.text);
  }
  if (notices.size === 0) return { text: null, unattributed };
  const body = [...notices.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, text]) => text)
    .join('\n');
  return {
    text: `This build contains code from the packages below, each followed by the license text and notices it ships.\n\n${body}`,
    unattributed,
  };
};

const sourceFile = (id: string): string | null => {
  const path = id.replace(/^\0/, '').replace(/\?.*$/, '');
  return path.startsWith('/') ? path : null;
};

/** Emits the notices file of every build that bundles code from installed packages. */
export const thirdPartyLicenses = (): Plugin => ({
  name: 'pie-third-party-licenses',
  generateBundle(_options, bundle) {
    const files = new Set<string>();
    const chunks = [];
    for (const output of Object.values(bundle)) {
      if (output.type === 'chunk') {
        chunks.push(output);
        for (const [id, module] of Object.entries(output.modules)) {
          const file = sourceFile(id);
          if (file && module.renderedLength > 0) files.add(file);
        }
      } else {
        for (const name of output.originalFileNames ?? []) {
          const file = sourceFile(name);
          if (file) files.add(file);
        }
      }
    }
    const { text: source, unattributed } = thirdPartyNotices(files);
    if (unattributed.length > 0) {
      this.error(
        `bundles code copied from installed packages that no ${NOTICES_FILE} covers; rebuild the package that ships it:\n${unattributed.join('\n')}`
      );
    }
    if (!source) return;
    const fileName =
      chunks.length === 1
        ? chunks[0].fileName.replace(/\.[cm]?js$/, `.${NOTICES_FILE}`)
        : NOTICES_FILE;
    this.emitFile({ type: 'asset', fileName, source });
  },
});
