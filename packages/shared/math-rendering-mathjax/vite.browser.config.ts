/**
 * The browser ESM build, `dist/browser/index.js`: the API of `dist/index.js` on the bundled MathJax
 * engine, `src/engine/bundled.ts`, in place of the page's. Element browser builds take it through
 * the `pie-browser-esm` export condition; every other consumer resolves `dist/index.js`.
 */
import { readdirSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import { noCdnHosts } from './vite.no-cdn';

const require = createRequire(join(__dirname, 'package.json'));
const packageDir = (name: string) => realpathSync(dirname(require.resolve(`${name}/package.json`)));

const MATHJAX_DIR = packageDir('@mathjax/src');
const FONT_DIR = packageDir('@mathjax/mathjax-newcm-font');
const MHCHEM_FONT_DIR = packageDir('@mathjax/mathjax-mhchem-font-extension');
/** SRE's settings module, which names jsDelivr as where its rule files load from. */
const SRE_VARIABLES = join(
  realpathSync(
    dirname(
      createRequire(join(MATHJAX_DIR, 'package.json')).resolve('speech-rule-engine/package.json')
    )
  ),
  'js',
  'common',
  'variables.js'
);

const PAGE_ENGINE = resolve(__dirname, 'src/engine/page.ts');
const BUNDLED_ENGINE = resolve(__dirname, 'src/engine/bundled.ts');
const BUNDLED_GLOBAL = resolve(__dirname, 'src/engine/bundled/global.ts');
const NODE_GLOBAL = resolve(__dirname, 'src/engine/bundled/node-global.ts');

const COMPONENTS = join(MATHJAX_DIR, 'mjs', 'components');
/** The one component module the engine imports: the menu reads `MathJax` from it. */
const GLOBAL_JS = join(COMPONENTS, 'global.js');
/** The component loader and startup, which bind to `window.MathJax`. */
const COMPONENT_MACHINERY = ['startup.js', 'loader.js', 'package.js'].map((file) =>
  join(COMPONENTS, file)
);

const ASSETS = 'virtual:bundled-mathjax-assets';
const DYNAMIC_FONTS = join(FONT_DIR, 'mjs', 'chtml', 'dynamic');

function assetsModule(): string {
  const loaders = readdirSync(DYNAMIC_FONTS)
    .filter((file) => file.endsWith('.js'))
    .sort()
    .map((file) => {
      const name = JSON.stringify(file.slice(0, -'.js'.length));
      return `  ${name}: () => import(${JSON.stringify(join(DYNAMIC_FONTS, file))}),`;
    });
  return ['export const dynamicFonts = {', ...loaders, '};'].join('\n');
}

const realpath = (id: string) => {
  try {
    return realpathSync(id.split('?')[0]);
  } catch {
    return id;
  }
};

/**
 * Builds the engine from `@mathjax/src` without the component machinery: swaps the page engine
 * for the bundled one and `components/global.js` for `src/engine/bundled/global.ts`, fails on the
 * component loader and startup, and fails when a second copy of either MathJax package, or the
 * CommonJS build of `@mathjax/src` beside its ES modules, is bundled. SRE's default rule-file URL
 * is emptied: the engine gives the speech worker its own, and SRE in the page loads no rules.
 */
function bundledMathjax(): Plugin {
  return {
    name: 'pie-bundled-mathjax',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      if (source === ASSETS) return `\0${ASSETS}`;
      if (!importer) return null;
      const resolved = await this.resolve(source, importer, { ...options, skipSelf: true });
      if (!resolved || resolved.external) return resolved;
      const file = realpath(resolved.id);
      if (file === PAGE_ENGINE) return BUNDLED_ENGINE;
      if (file === GLOBAL_JS) return BUNDLED_GLOBAL;
      if (COMPONENT_MACHINERY.includes(file)) {
        this.error(`the MathJax component machinery reached the bundled engine: ${file}`);
      }
      return resolved;
    },
    load(id) {
      return id === `\0${ASSETS}` ? assetsModule() : null;
    },
    transform(code, id) {
      if (realpath(id) !== SRE_VARIABLES) return null;
      const emptied = code.replace(/Variables\.url\s*=[^;]*;/, "Variables.url = '';");
      if (emptied === code) this.error(`SRE's Variables.url is not where the build expects: ${id}`);
      return emptied;
    },
    buildEnd(error) {
      if (error) return;
      for (const id of this.getModuleIds()) {
        const file = realpath(id);
        if (file.startsWith(join(MATHJAX_DIR, 'cjs/'))) {
          this.error(`the CommonJS build of @mathjax/src reached the bundled engine: ${file}`);
        }
        for (const [name, root] of [
          ['@mathjax/src', MATHJAX_DIR],
          ['@mathjax/mathjax-newcm-font', FONT_DIR],
          ['@mathjax/mathjax-mhchem-font-extension', MHCHEM_FONT_DIR],
        ]) {
          const marker = `${join('node_modules', name)}/`;
          if (file.includes(marker) && !file.startsWith(`${root}/`)) {
            this.error(`a second copy of ${name} reached the bundled engine: ${file}`);
          }
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [bundledMathjax(), noCdnHosts()],
  // The fonts import @mathjax/src without declaring it.
  resolve: { dedupe: ['@mathjax/src', '@mathjax/mathjax-newcm-font'] },
  build: {
    outDir: 'dist/browser',
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    rolldownOptions: {
      external: ['@pie-element/shared-math-rendering-core'],
      transform: {
        // wicked-good-xpath, which the speech rule engine imports, installs itself on Node's
        // `global`. Here that is an object of the engine, so the page gains no `wgxpath`.
        inject: { global: [NODE_GLOBAL, 'global'] },
      },
    },
  },
});
