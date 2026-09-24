import { existsSync, rmSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig, type EnvironmentOptions, type Plugin } from 'vite';

const packageDir = process.cwd();
const distDir = resolve(packageDir, 'dist');

type Lane = {
  /** Vite environment name, restricted to [\w$]. */
  name: string;
  entry: string;
  /** Output path relative to dist/, matching the package.json export target. */
  output: string;
  compilesSvelte: boolean;
};

// Each npm ESM lane is its own self-contained build, so importing one lane never
// loads a chunk shared with another. Lanes whose entry file is absent are skipped,
// and dist/ mirrors src/: src/delivery/index.ts builds to dist/delivery/index.js.
const lanes: Lane[] = [
  { name: 'index', source: 'src/index.ts', compilesSvelte: true },
  { name: 'delivery', source: 'src/delivery/index.ts', compilesSvelte: true },
  { name: 'controller', source: 'src/controller/index.ts', compilesSvelte: false },
  { name: 'author', source: 'src/author/index.ts', compilesSvelte: true },
  { name: 'print', source: 'src/print/index.ts', compilesSvelte: true },
  { name: 'runtimeSupport', source: 'src/runtime-support.ts', compilesSvelte: false },
]
  .map(({ source, ...lane }) => ({
    ...lane,
    entry: resolve(packageDir, source),
    output: source.replace(/^src\//, '').replace(/\.ts$/, '.js'),
  }))
  .filter((lane) => existsSync(lane.entry));

if (lanes.length === 0) {
  throw new Error(`No Svelte element ESM entry points found in ${packageDir}`);
}

// The root entry imports other lanes rather than bundling them: a second bundled
// copy of the delivery lane is a second element class, so a host importing both
// `@pie-element/<name>` and `/delivery` would hold two constructors for one element.
const rootImportsLaneOutputs = (): Plugin => {
  const outputByEntry = new Map(
    lanes.filter((lane) => lane.name !== 'index').map((lane) => [lane.entry, `./${lane.output}`])
  );
  return {
    name: 'pie-svelte-element-root-imports-lane-outputs',
    // Ahead of Vite's resolver, which would otherwise resolve the lane entry to source.
    enforce: 'pre',
    applyToEnvironment: (environment) => environment.name === 'index',
    async resolveId(source, importer) {
      if (!importer) return null;
      const resolved = await this.resolve(source, importer);
      const output = resolved ? outputByEntry.get(resolved.id) : undefined;
      return output ? { id: output, external: true } : null;
    },
  };
};

// Svelte compiles only in the component lanes: a controller that imports a
// component fails its build instead of shipping one.
const svelteLaneNames = new Set(
  lanes.filter((lane) => lane.compilesSvelte).map((lane) => lane.name)
);
const sveltePlugins = svelte({
  compilerOptions: {
    customElement: true,
  },
  emitCss: false,
}).map(
  (plugin): Plugin => ({
    ...plugin,
    applyToEnvironment: (environment) => svelteLaneNames.has(environment.name),
  })
);

const laneEnvironment = (lane: Lane): EnvironmentOptions => ({
  consumer: 'client',
  build: {
    outDir: dirname(resolve(distDir, lane.output)),
    lib: {
      entry: lane.entry,
      fileName: () => basename(lane.output),
      formats: ['es'],
    },
  },
});

// First step of every Svelte element build script: it empties dist/, which the
// browser, IIFE and declaration steps then write into.
export default defineConfig({
  root: packageDir,
  plugins: [rootImportsLaneOutputs(), ...sveltePlugins],
  build: {
    emptyOutDir: false,
    target: 'es2020',
    minify: false,
    sourcemap: true,
    rolldownOptions: {
      output: {
        codeSplitting: false,
      },
    },
  },
  environments: Object.fromEntries(lanes.map((lane) => [lane.name, laneEnvironment(lane)])),
  builder: {
    async buildApp(builder) {
      rmSync(distDir, { recursive: true, force: true });
      for (const lane of lanes) {
        await builder.build(builder.environments[lane.name]);
      }
    },
  },
});
