import { existsSync, readdirSync, statSync, watch } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';

type DemoEntry = {
  name: string;
  packageRoot: string;
  demoRoot: string;
  demoHtml: string;
  routeBase: string;
  demoUrl: string;
};

const DEFAULT_PORT = 5181;

function repoRootFromHere(): string {
  // apps/demo-index/src -> repo root
  return path.resolve(import.meta.dir, '..', '..', '..');
}

const repoRoot = process.env.PIE_ELEMENTS_NG_PATH || repoRootFromHere();
const port = Number(process.env.PIE_DEMO_INDEX_PORT ?? DEFAULT_PORT);
const skipBuild =
  (process.env.PIE_DEMO_INDEX_SKIP_BUILD ?? '').toLowerCase() === 'true' ||
  process.env.PIE_DEMO_INDEX_SKIP_BUILD === '1';
const skipWatch =
  (process.env.PIE_DEMO_INDEX_SKIP_WATCH ?? '').toLowerCase() === 'true' ||
  process.env.PIE_DEMO_INDEX_SKIP_WATCH === '1';

const ELEMENTS_REACT_DIR = path.join(repoRoot, 'packages', 'elements-react');

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function safePath(rootDir: string, urlPath: string): string | null {
  const cleaned = decodeURIComponent(urlPath.split('?')[0]).replace(/^\/+/, '');
  const resolved = path.resolve(rootDir, cleaned);
  if (!resolved.startsWith(path.resolve(rootDir))) {
    return null;
  }
  return resolved;
}

function listDemoEntries(): { demos: DemoEntry[]; missingBuilds: string[] } {
  if (!existsSync(ELEMENTS_REACT_DIR)) return { demos: [], missingBuilds: [] };

  const entries = readdirSync(ELEMENTS_REACT_DIR, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)
    .sort();

  const demos: DemoEntry[] = [];
  const missingBuilds: string[] = [];
  for (const name of entries) {
    const packageRoot = path.join(ELEMENTS_REACT_DIR, name);
    const demoRoot = path.join(packageRoot, 'docs', 'demo');
    const demoHtml = path.join(demoRoot, 'index.html');
    if (!existsSync(demoHtml)) continue;
    const distEntry = path.join(packageRoot, 'dist', 'index.js');
    if (!existsSync(distEntry)) {
      missingBuilds.push(name);
      continue;
    }
    demos.push({
      name,
      packageRoot,
      demoRoot,
      demoHtml,
      routeBase: `/pkg/${name}/`,
      demoUrl: `/pkg/${name}/docs/demo/index.html`,
    });
  }

  return { demos, missingBuilds };
}

function renderIndex(demos: DemoEntry[], missingBuilds: string[]): string {
  const rows = demos
    .map(
      (demo) =>
        `<li><a href="${demo.demoUrl}">${demo.name}</a> <span class="path">${demo.demoUrl}</span></li>`
    )
    .join('\n');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>PIE demo index</title>
    <style>
      :root { color-scheme: light dark; }
      body { font-family: system-ui, -apple-system, Segoe UI, sans-serif; margin: 2rem; line-height: 1.5; }
      h1 { margin-bottom: 0.25rem; }
      .sub { margin-top: 0; color: #666; }
      ul { padding-left: 1.2rem; }
      li { margin: 0.35rem 0; }
      a { text-decoration: none; }
      a:hover { text-decoration: underline; }
      .path { color: #888; font-size: 0.9em; margin-left: 0.5rem; }
      .empty { margin-top: 1rem; color: #b00; }
      code { background: #f2f2f2; padding: 0.1rem 0.25rem; border-radius: 3px; }
    </style>
  </head>
  <body>
    <h1>PIE demo index</h1>
    <p class="sub">Auto-discovered demos from <code>packages/elements-react/*/docs/demo</code></p>
    ${
      demos.length
        ? `<ul>${rows}</ul>`
        : `<p class="empty">No demos found. Run <code>bun run cli upstream:sync</code> and then <code>bun run build</code>.</p>`
    }
    ${
      missingBuilds.length
        ? `<p class="empty">Missing builds for: <code>${missingBuilds.join(
            '</code>, <code>'
          )}</code>. Run <code>bun run build</code> to generate dist outputs.</p>`
        : ''
    }
  </body>
</html>`;
}

function json(data: unknown): Response {
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

function text(data: string, status = 200): Response {
  return new Response(data, {
    status,
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}

async function runBuild(): Promise<void> {
  if (skipBuild) {
    console.log('[demo-index] Skipping build (PIE_DEMO_INDEX_SKIP_BUILD=true)');
    return;
  }

  // Only build packages that have demos
  const { demos, missingBuilds } = listDemoEntries();

  if (demos.length === 0 && missingBuilds.length === 0) {
    console.log('[demo-index] No demos found, skipping build');
    return;
  }

  if (missingBuilds.length === 0) {
    console.log('[demo-index] All demos already built, skipping initial build');
    console.log('[demo-index] Watch mode will rebuild on changes');
    return;
  }

  console.log(`[demo-index] Building ${missingBuilds.length} package(s) with demos...`);

  // Build only packages that have demos (turbo will handle dependencies)
  const filters = missingBuilds.map((name) => `--filter=@pie-element/${name}`);

  await new Promise<void>((resolve, reject) => {
    const child = spawn('bun', ['x', 'turbo', 'run', 'build', ...filters], {
      cwd: repoRoot,
      stdio: 'inherit',
      env: process.env,
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Build failed (exit code ${code ?? 'null'})`));
    });
  });
}

function startWatch(): void {
  if (skipWatch) {
    console.log('[demo-index] Skipping watch mode (PIE_DEMO_INDEX_SKIP_WATCH=true)');
    return;
  }

  console.log('[demo-index] Starting watch mode for element packages...');

  // Use file-based watching (faster and more reliable than turbo dev)
  // Turbo dev might not exist or might hang, so we use direct file watching
  startFileWatcher();

  // Cleanup on process exit
  const cleanup = () => {
    child.kill();
    for (const controller of watchControllers) {
      controller.abort();
    }
    if (rebuildTimeout) clearTimeout(rebuildTimeout);
  };

  process.on('SIGINT', () => {
    cleanup();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    cleanup();
    process.exit(0);
  });
}

let rebuildTimeout: ReturnType<typeof setTimeout> | null = null;
let watchControllers: AbortController[] = [];

function startFileWatcher(): void {
  console.log('[demo-index] Setting up file watchers for src directories...');

  const watchDirs = [
    path.join(repoRoot, 'packages', 'elements-react'),
    path.join(repoRoot, 'packages', 'lib-react'),
  ];

  for (const watchDir of watchDirs) {
    if (!existsSync(watchDir)) continue;

    const controller = new AbortController();
    watchControllers.push(controller);

    try {
      watch(watchDir, { recursive: true, signal: controller.signal }, (_eventType, filename) => {
        if (!filename) return;
        // Only watch for source file changes
        if (
          filename.includes('/src/') &&
          (filename.endsWith('.ts') ||
            filename.endsWith('.tsx') ||
            filename.endsWith('.js') ||
            filename.endsWith('.jsx'))
        ) {
          // Debounce rebuilds
          if (rebuildTimeout) clearTimeout(rebuildTimeout);
          rebuildTimeout = setTimeout(() => {
            console.log(`[demo-index] Source file changed: ${filename}, triggering rebuild...`);
            runBuild().catch((err) => {
              console.error('[demo-index] Rebuild failed:', err);
            });
          }, 1000);
        }
      });
    } catch (err) {
      console.error(`[demo-index] Failed to watch ${watchDir}:`, err);
    }
  }
}

async function main(): Promise<void> {
  // Start watch mode immediately (non-blocking)
  startWatch();

  // Start server immediately, build in background if needed
  const { missingBuilds } = listDemoEntries();
  if (missingBuilds.length > 0 && !skipBuild) {
    console.log(
      `[demo-index] ${missingBuilds.length} package(s) need building (will build in background)`
    );
    // Build in background, don't wait
    runBuild().catch((err) => {
      console.error('[demo-index] Background build failed:', err);
    });
  }

  let actualPort = port;
  let server: ReturnType<typeof Bun.serve> | null = null;

  // Try to start server, finding available port if needed
  for (let attempt = 0; attempt < 10; attempt++) {
    try {
      server = Bun.serve({
        port: actualPort,
        async fetch(req) {
          const url = new URL(req.url);
          const pathname = url.pathname;

          if (pathname === '/' || pathname === '/index.html') {
            const { demos, missingBuilds } = listDemoEntries();
            return new Response(renderIndex(demos, missingBuilds), {
              headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
            });
          }

          if (pathname === '/__demos.json') {
            const { demos, missingBuilds } = listDemoEntries();
            const payload = demos.map((demo) => ({
              name: demo.name,
              routeBase: demo.routeBase,
              demoHtml: demo.demoUrl,
            }));
            return json({ count: payload.length, demos: payload, missingBuilds });
          }

          if (pathname === '/health') {
            const { demos, missingBuilds } = listDemoEntries();
            return json({ ok: demos.length > 0, count: demos.length, missingBuilds });
          }

          if (pathname.startsWith('/demo/')) {
            const parts = pathname.split('/').filter(Boolean);
            const name = parts[1];
            if (!name) return text('Missing demo name', 400);

            // If it's just /demo/<name>/ or /demo/<name>, redirect to the demo HTML
            if (parts.length === 2 || (parts.length === 3 && parts[2] === '')) {
              const target = `/pkg/${name}/docs/demo/index.html`;
              return new Response(null, {
                status: 302,
                headers: { location: target },
              });
            }

            // Otherwise, serve files from the package (for relative imports in demo.mjs)
            const packageRoot = path.join(ELEMENTS_REACT_DIR, name);
            if (!existsSync(packageRoot)) return text('Demo not found', 404);

            // Map /demo/<name>/docs/demo/* to package docs/demo/*
            // Map /demo/<name>/dist/* to package dist/*
            // Map /demo/<name>/* to package/*
            const rest = parts.slice(2).join('/');
            const filePath = safePath(packageRoot, rest);
            if (!filePath) return text('Forbidden', 403);

            if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
              return text('Not found', 404);
            }

            const ext = path.extname(filePath).toLowerCase();
            const contentType = MIME_TYPES[ext] ?? 'application/octet-stream';
            const body = await readFile(filePath);
            return new Response(body, {
              headers: {
                'content-type': contentType,
                'cache-control': 'no-store',
              },
            });
          }

          if (pathname.startsWith('/pkg/')) {
            const parts = pathname.split('/').filter(Boolean);
            const name = parts[1];
            if (!name) return text('Missing demo name', 400);

            const packageRoot = path.join(ELEMENTS_REACT_DIR, name);
            if (!existsSync(packageRoot)) return text('Demo not found', 404);

            const rest = parts.slice(2).join('/');
            const targetPath = rest ? rest : 'docs/demo/index.html';
            const filePath = safePath(packageRoot, targetPath);
            if (!filePath) return text('Forbidden', 403);

            if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
              return text('Not found', 404);
            }

            const ext = path.extname(filePath).toLowerCase();
            const contentType = MIME_TYPES[ext] ?? 'application/octet-stream';
            const body = await readFile(filePath);
            return new Response(body, {
              headers: {
                'content-type': contentType,
                'cache-control': 'no-store',
              },
            });
          }

          return text('Not found', 404);
        },
      });
      // Successfully started
      break;
    } catch (err: any) {
      if (err?.code === 'EADDRINUSE' && attempt < 9) {
        actualPort++;
        console.log(`[demo-index] Port ${actualPort - 1} in use, trying ${actualPort}...`);
        continue;
      }
      throw err;
    }
  }

  if (!server) {
    throw new Error(`Could not start server on port ${port} or nearby ports`);
  }

  console.log(`PIE demo index running at http://localhost:${actualPort}`);
  if (actualPort !== port) {
    console.log(`(Requested port ${port} was in use)`);
  }
  console.log('Index: /');
  console.log('JSON: /__demos.json');
}

main().catch((err) => {
  console.error('[demo-index] Failed to start:', err);
  process.exit(1);
});
