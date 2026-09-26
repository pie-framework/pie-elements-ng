import { createHash } from 'node:crypto';
import { dirname, relative } from 'node:path/posix';
import postcss, { type AtRule, type ChildNode, type Declaration, list } from 'postcss';
import type { Plugin, Rolldown } from 'vite';

// Library mode extracts every stylesheet a chunk imports into a .css file that nothing
// references, and browser ESM hosts load no element CSS, so MathQuill's rules never applied.
// This plugin compiles each extracted stylesheet into the chunks that import it: the chunk
// installs the rules in a <style> element before its own code runs, which is what
// style-loader gives the IIFE bundles.
//
// The rules travel as a string inside the chunk. A host bundler copies a stylesheet it reaches
// through `new URL(..., import.meta.url)` verbatim, so the url() references inside it would not
// resolve, and holding the chunk until a <link> applies takes top-level await, which default
// Vite 6 builds reject. The assets the rules reference ship as files beside the chunks, each
// named by a literal `new URL("./…", import.meta.url)`, the one asset reference every bundler
// follows.
//
// The <style> element carries a hash of the stylesheet as data-pie-css, so copies of the same
// stylesheet from several packages, or several builds on one page, install once.

// Vite's inline limit for app builds, which library mode skips: it inlines every asset whatever
// its size, which put MathQuill's font into each stylesheet four times over.
const INLINE_LIMIT_BYTES = 4096;

const ASSET_DIRECTORY = 'assets';

const FILE_EXTENSIONS: Record<string, string> = {
  'application/vnd.ms-fontobject': 'eot',
  'font/otf': 'otf',
  'font/ttf': 'ttf',
  'font/woff': 'woff',
  'font/woff2': 'woff2',
  'image/avif': 'avif',
  'image/gif': 'gif',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/svg+xml': 'svg',
  'image/webp': 'webp',
};

const URL_TOKEN = /url\(\s*(?:"([^"]*)"|'([^']*)'|([^\s"')]+))\s*\)/gi;
const DATA_URI = /^data:([\w.+-]+\/[\w.+-]+)((?:;[\w.+-]+=[^;,]*)*)(;base64)?,(.*)$/is;
const PLACEHOLDER_PREFIX = '__pie_css_asset_';
const PLACEHOLDER = /__pie_css_asset_(\d+)__/;
const WOFF2_FORMAT = /\bformat\(\s*(["']?)woff2\1\s*\)/i;
const WOFF2_DATA_URI = /url\(\s*["']?data:font\/woff2[;,]/i;

type Stylesheet = {
  hash: string;
  /** CSS text split around asset references, alternating text and asset index. */
  tokens: string[];
  /** Bundle file name of each referenced asset. */
  assets: string[];
};

type EmitAsset = (baseName: string, extension: string, source: Uint8Array) => string;

const isSourceDeclaration = (node: ChildNode): node is Declaration =>
  node.type === 'decl' && node.prop.toLowerCase() === 'src';

const isWoff2Source = (entry: string): boolean =>
  WOFF2_FORMAT.test(entry) || WOFF2_DATA_URI.test(entry);

// Every browser that runs these ES modules supports WOFF2, and a browser reads only the last
// src declaration of a @font-face rule, so the formats listed beside a WOFF2 source are files
// no supported browser downloads.
function keepWoff2Sources(rule: AtRule): void {
  const sources = (rule.nodes ?? []).filter(isSourceDeclaration);
  const used = sources.at(-1);
  if (!used) return;
  const kept = list
    .comma(used.value)
    .filter((entry) => /^local\(/i.test(entry) || isWoff2Source(entry));
  if (!kept.some(isWoff2Source)) return;
  for (const source of sources) {
    if (source !== used) source.remove();
  }
  used.value = kept.join(',');
}

function decodeDataUri(uri: string): { extension: string; source: Uint8Array } | null {
  const match = DATA_URI.exec(uri);
  const extension = match && FILE_EXTENSIONS[match[1].toLowerCase()];
  if (!match || !extension) return null;
  try {
    const payload = match[4];
    const source = match[3]
      ? Buffer.from(payload, 'base64')
      : Buffer.from(decodeURIComponent(payload), 'utf8');
    return { extension, source };
  } catch {
    return null;
  }
}

function assetBaseName(declaration: Declaration): string {
  const rule = declaration.parent;
  if (rule?.type === 'atrule' && (rule as AtRule).name.toLowerCase() === 'font-face') {
    const family = (rule as AtRule).nodes?.find(
      (node): node is Declaration =>
        node.type === 'decl' && node.prop.toLowerCase() === 'font-family'
    );
    const name = family?.value.replace(/^["']|["']$/g, '').replace(/[^\w-]+/g, '-');
    if (name) return name;
  }
  return 'asset';
}

export function compileStylesheet(css: string, emitAsset: EmitAsset): Stylesheet {
  if (css.includes(PLACEHOLDER_PREFIX)) {
    throw new Error(`stylesheet already contains the asset placeholder ${PLACEHOLDER_PREFIX}`);
  }
  const hash = createHash('sha256').update(css).digest('hex').slice(0, 16);
  const root = postcss.parse(css);
  root.walkAtRules(/^font-face$/i, keepWoff2Sources);

  const assets: string[] = [];
  root.walkDecls((declaration) => {
    if (!declaration.value.includes('data:')) return;
    declaration.value = declaration.value.replace(
      URL_TOKEN,
      (token, doubleQuoted?: string, singleQuoted?: string, bare?: string) => {
        const asset = decodeDataUri(doubleQuoted ?? singleQuoted ?? bare ?? '');
        if (!asset || asset.source.byteLength <= INLINE_LIMIT_BYTES) return token;
        assets.push(emitAsset(assetBaseName(declaration), asset.extension, asset.source));
        return `url("${PLACEHOLDER_PREFIX}${assets.length - 1}__")`;
      }
    );
  });

  return { hash, tokens: root.toString().split(PLACEHOLDER), assets };
}

const relativeHref = (fromFile: string, toFile: string): string => {
  const href = relative(dirname(fromFile), toFile);
  return href.startsWith('.') ? href : `./${href}`;
};

function cssExpression(stylesheet: Stylesheet, chunkFileName: string): string {
  const pieces = [JSON.stringify(stylesheet.tokens[0])];
  for (let i = 1; i < stylesheet.tokens.length; i += 2) {
    const href = relativeHref(chunkFileName, stylesheet.assets[Number(stylesheet.tokens[i])]);
    pieces.push(`url(() => new URL(${JSON.stringify(href)}, import.meta.url))`);
    pieces.push(JSON.stringify(stylesheet.tokens[i + 1]));
  }
  return pieces.join(' + ');
}

function makeStylesheetInstaller(stylesheets: Stylesheet[], chunkFileName: string): string {
  const entries = stylesheets.map(
    (stylesheet) =>
      `[${JSON.stringify(stylesheet.hash)}, (url) => ${cssExpression(stylesheet, chunkFileName)}]`
  );
  // A URL that cannot resolve (a module evaluated from a blob: URL) costs the asset, not the rules.
  return `((stylesheets) => {
  if (typeof document === "undefined") return;
  const url = (resolve) => {
    try {
      return resolve().href;
    } catch (error) {
      console.warn("[pie] cannot resolve a stylesheet asset", error);
      return "";
    }
  };
  for (const [hash, css] of stylesheets) {
    if (document.querySelector('style[data-pie-css="' + hash + '"]')) continue;
    const style = document.createElement("style");
    style.dataset.pieCss = hash;
    style.textContent = css(url);
    (document.head || document.documentElement).appendChild(style);
  }
})([${entries.join(', ')}]);
`;
}

const toText = (source: string | Uint8Array): string =>
  typeof source === 'string' ? source : new TextDecoder().decode(source);

function shiftSourcemap(
  chunk: Rolldown.OutputChunk,
  bundle: Rolldown.OutputBundle,
  lineCount: number
): void {
  const prefix = ';'.repeat(lineCount);
  if (chunk.map) {
    chunk.map.mappings = prefix + chunk.map.mappings;
  }
  const mapFile = chunk.sourcemapFileName ? bundle[chunk.sourcemapFileName] : undefined;
  if (mapFile?.type === 'asset') {
    const map = JSON.parse(toText(mapFile.source)) as { mappings: string };
    map.mappings = prefix + map.mappings;
    mapFile.source = JSON.stringify(map);
  }
}

export function browserCssLoaderPlugin(): Plugin {
  return {
    name: 'pie-browser-css-loader',
    enforce: 'post',
    config: () => ({ build: { cssCodeSplit: true } }),
    generateBundle(_options, bundle) {
      const compiled = new Map<string, Stylesheet>();
      const emitted = new Set<string>();
      const emitAsset: EmitAsset = (baseName, extension, source) => {
        const hash = createHash('sha256').update(source).digest('hex').slice(0, 8);
        const fileName = `${ASSET_DIRECTORY}/${baseName}-${hash}.${extension}`;
        if (!emitted.has(fileName)) {
          emitted.add(fileName);
          this.emitFile({ type: 'asset', fileName, source });
        }
        return fileName;
      };

      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== 'chunk') continue;
        const importedCss = chunk.viteMetadata?.importedCss;
        if (!importedCss || importedCss.size === 0) continue;
        const stylesheets = [...importedCss].map((cssFile) => {
          const cached = compiled.get(cssFile);
          if (cached) return cached;
          const asset = bundle[cssFile];
          if (asset?.type !== 'asset') {
            this.error(`${chunk.fileName} imports ${cssFile}, which is not in the bundle`);
          }
          const stylesheet = compileStylesheet(toText(asset.source), emitAsset);
          compiled.set(cssFile, stylesheet);
          return stylesheet;
        });
        const installer = makeStylesheetInstaller(stylesheets, chunk.fileName);
        chunk.code = installer + chunk.code;
        shiftSourcemap(chunk, bundle, installer.split('\n').length - 1);
        importedCss.clear();
      }

      for (const cssFile of compiled.keys()) {
        delete bundle[cssFile];
      }
    },
  };
}
