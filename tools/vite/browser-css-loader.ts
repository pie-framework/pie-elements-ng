import { createHash } from 'node:crypto';
import { dirname, relative } from 'node:path/posix';
import type { Plugin, Rolldown } from 'vite';

// Library mode extracts every stylesheet the bundled code imports (MathQuill's, for one) into
// a .css file that nothing references, and browser ESM hosts load no CSS. This plugin makes
// each chunk load the CSS Vite split out of it before the chunk's own code runs, which is what
// style-loader gives IIFE bundles.
//
// Loads are shared per page through a global registry keyed by content hash, so elements that
// ship identical CSS fetch it once. Packages built by different versions of this plugin share
// that registry: changing the value shape (Map<hash, Promise<void>>) requires a new key.
const CSS_REGISTRY_KEY = 'pie-elements-ng.browser-css';

type Stylesheet = [hash: string, href: string];

function makeStylesheetLoader(stylesheets: Stylesheet[]): string {
  // Held by top-level await so the chunk evaluates after its CSS applies. A failed load warns
  // and lets the chunk evaluate anyway: an unstyled element beats one that never registers.
  return `await ((stylesheets) => {
  if (typeof document === "undefined") return;
  const registry = Symbol.for(${JSON.stringify(CSS_REGISTRY_KEY)});
  const loads = globalThis[registry] || (globalThis[registry] = new Map());
  return Promise.all(stylesheets.map(([hash, file]) => {
    if (loads.has(hash)) return loads.get(hash);
    let href;
    try {
      href = new URL(file, import.meta.url).href;
    } catch (error) {
      console.warn("[pie] cannot resolve stylesheet " + file, error);
      return;
    }
    const load = new Promise((resolve) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.dataset.pieCss = hash;
      link.onload = () => resolve();
      link.onerror = () => {
        link.remove();
        loads.delete(hash);
        console.warn("[pie] could not load stylesheet " + href);
        resolve();
      };
      (document.head || document.documentElement).appendChild(link);
    });
    loads.set(hash, load);
    return load;
  }));
})(${JSON.stringify(stylesheets)});
`;
}

const toText = (source: string | Uint8Array): string =>
  typeof source === 'string' ? source : new TextDecoder().decode(source);

// The loader is prepended as whole lines, so the chunk's existing mappings stay valid once
// every generated line moves down by the same count.
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
    // After vite:css-post, whose generateBundle folds pure-CSS chunks into their importers'
    // importedCss.
    enforce: 'post',
    config: () => ({
      // Per-chunk CSS is what lets a chunk load only the stylesheets its own modules import.
      build: { cssCodeSplit: true },
    }),
    generateBundle(_options, bundle) {
      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== 'chunk') {
          continue;
        }
        const cssFiles = [...(chunk.viteMetadata?.importedCss ?? [])];
        if (cssFiles.length === 0) {
          continue;
        }

        const stylesheets = cssFiles.map((cssFile): Stylesheet => {
          const asset = bundle[cssFile];
          if (asset?.type !== 'asset') {
            this.error(`${chunk.fileName} imports ${cssFile}, which is not in the bundle`);
          }
          const hash = createHash('sha256').update(asset.source).digest('hex').slice(0, 16);
          const href = relative(dirname(chunk.fileName), cssFile);
          return [hash, href.startsWith('.') ? href : `./${href}`];
        });

        const loader = makeStylesheetLoader(stylesheets);
        chunk.code = loader + chunk.code;
        shiftSourcemap(chunk, bundle, loader.split('\n').length - 1);
      }
    },
  };
}
