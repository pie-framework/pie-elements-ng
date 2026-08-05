import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const appDir = dirname(fileURLToPath(import.meta.url));
const monorepoRoot = resolve(appDir, '../..');
const configuredPlayersRoot = process.env.PIE_PLAYERS_ROOT
  ? resolve(process.env.PIE_PLAYERS_ROOT)
  : undefined;
const defaultPlayersRoot = resolve(monorepoRoot, '../pie-players');
const playersRoot =
  configuredPlayersRoot || (existsSync(defaultPlayersRoot) ? defaultPlayersRoot : undefined);
const fsAllow = [monorepoRoot, playersRoot].filter(Boolean);

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5300,
    open: true,
    fs: {
      allow: fsAllow,
    },
  },
  resolve: {},
});
