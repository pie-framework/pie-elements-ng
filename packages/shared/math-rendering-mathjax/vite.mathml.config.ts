/**
 * The `./mathml` build, `dist/tex-to-mathml/index.js`: `texToMathml` with the MathJax TeX input
 * it runs on bundled, so it imports nothing and runs wherever ES modules do. Its declaration is
 * written here: what tsc would emit for the entry's modules names MathJax's types, which the
 * package does not depend on. `tsconfig.browser.json` type-checks the entry.
 */
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import { noCdnHosts } from './vite.no-cdn';

const DECLARATION = `/**
 * \`html\` with each TeX expression in it replaced by a \`<math>\` element in MathML Core. HTML without
 * TeX comes back as given; otherwise it comes back reserialized. TeX that fails to parse becomes
 * MathML's error element, as delivery shows it. Authored \`<math>\` passes through unchanged.
 */
export declare function texToMathml(html: string): string;
`;

function declaration(): Plugin {
  return {
    name: 'pie-mathml-declaration',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'index.d.ts', source: DECLARATION });
    },
  };
}

export default defineConfig({
  plugins: [noCdnHosts(), declaration()],
  build: {
    outDir: 'dist/tex-to-mathml',
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, 'src/tex-to-mathml/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
  },
});
