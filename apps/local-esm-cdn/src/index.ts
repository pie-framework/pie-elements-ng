import { existsSync } from 'node:fs';
import { readFile, readdir, stat } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { rewriteImports } from './rewrite-imports';

type Health = {
  ok: boolean;
  pieElementsNgPath: string;
  elementsReactPath: string;
  libReactPath: string;
  builtElementPackages: number;
  builtLibPackages: number;
  sampleElement?: string;
  sampleLib?: string;
};

const DEFAULT_PORT = 5179;
const DEFAULT_ESM_SH = 'https://esm.sh';
const DEFAULT_BUILD_SCOPE: BuildScope = 'esm';

type BuildScope = 'none' | 'esm' | 'all';

function repoRootFromHere(): string {
  // apps/local-esm-cdn/src -> repo root
  return path.resolve(import.meta.dir, '..', '..', '..');
}

function withCors(headers: HeadersInit = {}): Headers {
  const h = new Headers(headers);
  h.set('Access-Control-Allow-Origin', '*');
  h.set('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS');
  h.set('Access-Control-Allow-Headers', '*');
  return h;
}

function json(data: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data, null, 2), {
    ...init,
    headers: withCors({
      'content-type': 'application/json; charset=utf-8',
      ...(init.headers ?? {}),
    }),
  });
}

function text(data: string, init: ResponseInit = {}): Response {
  return new Response(data, {
    ...init,
    headers: withCors({
      'content-type': 'text/plain; charset=utf-8',
      ...(init.headers ?? {}),
    }),
  });
}

function js(data: string, init: ResponseInit = {}): Response {
  return new Response(data, {
    ...init,
    headers: withCors({
      'content-type': 'application/javascript; charset=utf-8',
      'cache-control': 'no-store',
      ...(init.headers ?? {}),
    }),
  });
}

function parsePackageRequest(pathname: string): { pkg: string; subpath: string } | null {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length < 2) return null;

  const scope = parts[0];
  if (scope !== '@pie-element' && scope !== '@pie-lib' && scope !== '@pie-elements-ng' && scope !== '@pie-framework') return null;

  const nameWithVersion = parts[1];
  // Accept either "<name>@<version>" or "<name>".
  const at = nameWithVersion.lastIndexOf('@');
  const name = at > 0 ? nameWithVersion.slice(0, at) : nameWithVersion;
  const pkg = `${scope}/${name}`;

  const subpath = parts.slice(2).join('/');
  return { pkg, subpath };
}

async function fileExists(p: string): Promise<boolean> {
  try {
    const s = await stat(p);
    return s.isFile();
  } catch {
    return false;
  }
}

async function findAnyBuiltPackages(
  packagesDir: string,
  max = 200
): Promise<{ count: number; sample?: string }> {
  let count = 0;
  let sample: string | undefined;

  let entries: string[];
  try {
    entries = await readdir(packagesDir);
  } catch {
    return { count: 0 };
  }

  for (const pkgName of entries.slice(0, max)) {
    const candidate = path.join(packagesDir, pkgName, 'dist', 'index.js');
    if (await fileExists(candidate)) {
      count++;
      if (!sample) sample = pkgName;
    }
  }
  return { count, sample };
}

async function resolveEntryFile(
  pieElementsNgPath: string,
  pkg: string,
  subpath: string
): Promise<string | null> {
  const [scope, name] = pkg.split('/') as [string, string];

  let base: string;
  if (scope === '@pie-element') {
    base = path.join(pieElementsNgPath, 'packages', 'elements-react', name, 'dist');
  } else if (scope === '@pie-lib') {
    base = path.join(pieElementsNgPath, 'packages', 'lib-react', name, 'dist');
  } else if (scope === '@pie-elements-ng') {
    // @pie-elements-ng/shared-* packages are in packages/shared/
    // e.g. @pie-elements-ng/shared-math-rendering -> packages/shared/math-rendering
    const packageName = name.replace(/^shared-/, '');
    base = path.join(pieElementsNgPath, 'packages', 'shared', packageName, 'dist');
  } else if (scope === '@pie-framework') {
    // @pie-framework packages are also in packages/shared/
    // e.g. @pie-framework/pie-player-events -> packages/shared/player-events
    const packageName = name.replace(/^pie-/, '');
    base = path.join(pieElementsNgPath, 'packages', 'shared', packageName, 'dist');
  } else {
    return null;
  }

  const normalizedSubpath = subpath.replace(/^\/+/, '').replace(/\/+$/, '');
  const candidates: string[] = [];

  if (!normalizedSubpath) {
    candidates.push(path.join(base, 'index.js'));
    candidates.push(path.join(base, 'index.mjs'));
  } else {
    // Try the path as-is first (for files that already have extensions like .js)
    candidates.push(path.join(base, normalizedSubpath));

    // Common build layouts: dist/<sub>/index.js or dist/<sub>.js
    candidates.push(path.join(base, normalizedSubpath, 'index.js'));
    candidates.push(path.join(base, `${normalizedSubpath}.js`));
    candidates.push(path.join(base, normalizedSubpath, 'index.mjs'));
    candidates.push(path.join(base, `${normalizedSubpath}.mjs`));

    // Some builds may output dist/<subpath>/index.js even for nested paths
    const nested = normalizedSubpath.split('/');
    if (nested.length > 1) {
      candidates.push(path.join(base, ...nested, 'index.js'));
      candidates.push(path.join(base, ...nested) + '.js');
    }
  }

  for (const c of candidates) {
    if (await fileExists(c)) return c;
  }
  return null;
}

let cachedHealth: { at: number; value: Health } | null = null;
async function getHealth(pieElementsNgPath: string): Promise<Health> {
  const now = Date.now();
  if (cachedHealth && now - cachedHealth.at < 1500) return cachedHealth.value;

  const elementsReactPath = path.join(pieElementsNgPath, 'packages', 'elements-react');
  const libReactPath = path.join(pieElementsNgPath, 'packages', 'lib-react');

  const elements = await findAnyBuiltPackages(elementsReactPath);
  const libs = await findAnyBuiltPackages(libReactPath);

  const ok = existsSync(pieElementsNgPath) && existsSync(elementsReactPath) && elements.count > 0;

  const value: Health = {
    ok,
    pieElementsNgPath,
    elementsReactPath,
    libReactPath,
    builtElementPackages: elements.count,
    builtLibPackages: libs.count,
    sampleElement: elements.sample,
    sampleLib: libs.sample,
  };

  cachedHealth = { at: now, value };
  return value;
}

const pieElementsNgPath = process.env.PIE_ELEMENTS_NG_PATH || repoRootFromHere();
const port = Number(process.env.LOCAL_ESM_CDN_PORT ?? DEFAULT_PORT);
const esmShBaseUrl = process.env.LOCAL_ESM_CDN_ESM_SH_BASE_URL || DEFAULT_ESM_SH;
const allowRandomPortFallback = !(
  (process.env.LOCAL_ESM_CDN_ALLOW_RANDOM_PORT_FALLBACK ?? '').toLowerCase() === 'false' ||
  process.env.LOCAL_ESM_CDN_ALLOW_RANDOM_PORT_FALLBACK === '0'
);
const selfTest =
  (process.env.LOCAL_ESM_CDN_SELF_TEST ?? '').toLowerCase() === 'true' ||
  process.env.LOCAL_ESM_CDN_SELF_TEST === '1';

function coerceBuildScope(v: string | undefined): BuildScope | null {
  if (!v) return null;
  const lower = v.toLowerCase();
  if (lower === 'none' || lower === 'esm' || lower === 'all') return lower;
  return null;
}

const buildScope: BuildScope =
  (process.env.LOCAL_ESM_CDN_SKIP_BUILD ?? '').toLowerCase() === 'true' ||
  process.env.LOCAL_ESM_CDN_SKIP_BUILD === '1'
    ? 'none'
    : (coerceBuildScope(process.env.LOCAL_ESM_CDN_BUILD_SCOPE) ?? DEFAULT_BUILD_SCOPE);

const helpText = `PIE local ESM CDN (dev-only)

This server serves local built PIE packages from disk and rewrites *external* imports to ${esmShBaseUrl}.

Endpoints:
  GET  /health
  GET  /@pie-element/<name>@<version>[/<subpath>]
  GET  /@pie-lib/<name>@<version>[/<subpath>]

Env:
  PIE_ELEMENTS_NG_PATH=${pieElementsNgPath}
  LOCAL_ESM_CDN_PORT=${port}
  LOCAL_ESM_CDN_ESM_SH_BASE_URL=${esmShBaseUrl}
  LOCAL_ESM_CDN_BUILD_SCOPE=${buildScope}
  LOCAL_ESM_CDN_SKIP_BUILD=${buildScope === 'none' ? 'true' : 'false'}
  LOCAL_ESM_CDN_ALLOW_RANDOM_PORT_FALLBACK=${allowRandomPortFallback ? 'true' : 'false'}
  LOCAL_ESM_CDN_SELF_TEST=${selfTest ? 'true' : 'false'}
`;

async function maybeRunBuild(): Promise<void> {
  if (buildScope === 'none') return;

  // eslint-disable-next-line no-console
  console.log(`[local-esm-cdn] Running build before starting server (scope=${buildScope})...`);

  const args =
    buildScope === 'all'
      ? ['run', 'build']
      : [
          'x',
          'turbo',
          'run',
          'build',
          '--filter=./packages/elements-react/*',
          '--filter=./packages/lib-react/*',
          '--filter=!@pie-lib/test-utils',
        ];

  await new Promise<void>((resolve, reject) => {
    const child = spawn('bun', args, {
      cwd: pieElementsNgPath,
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

async function main(): Promise<void> {
  await maybeRunBuild();

  const fetchHandler: Parameters<typeof Bun.serve>[0]['fetch'] = async (req) => {
    const url = new URL(req.url);

    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: withCors() });
    }

    if (url.pathname === '/' || url.pathname === '/__help') {
      return text(helpText);
    }

    if (url.pathname === '/health') {
      const health = await getHealth(pieElementsNgPath);
      return json(health, { status: health.ok ? 200 : 503 });
    }

    const parsed = parsePackageRequest(url.pathname);
    if (!parsed) {
      return text(`Not found.\n\n${helpText}`, { status: 404 });
    }

    const health = await getHealth(pieElementsNgPath);
    if (!health.ok) {
      return json(
        {
          error: 'Local ESM CDN is not ready: missing built artifacts.',
          hint: 'Run `bun run build` in pie-elements-ng (or build the relevant packages) and try again.',
          health,
        },
        { status: 503 }
      );
    }

    const entryFile = await resolveEntryFile(pieElementsNgPath, parsed.pkg, parsed.subpath);
    if (!entryFile) {
      return json(
        {
          error: 'Entrypoint not found on disk.',
          requested: parsed,
          tried: {
            pkg: parsed.pkg,
            subpath: parsed.subpath,
          },
          hint: 'Ensure pie-elements-ng is built and the package exists in packages/elements-react or packages/lib-react.',
        },
        { status: 404 }
      );
    }

    const code = await readFile(entryFile, 'utf8');
    const rewritten = await rewriteImports(code, {
      esmShBaseUrl,
      pkg: parsed.pkg,
      subpath: parsed.subpath,
    });
    return js(rewritten, {
      headers: {
        'x-local-esm-cdn-file': entryFile,
      },
    });
  };

  let server: ReturnType<typeof Bun.serve> | null = null;
  try {
    server = Bun.serve({ port, fetch: fetchHandler });
  } catch (e: any) {
    const code = e?.code ?? e?.errno ?? e?.cause?.code;
    if (code === 'EADDRINUSE' && port !== 0 && allowRandomPortFallback) {
      // eslint-disable-next-line no-console
      console.warn(`[local-esm-cdn] Port ${port} is in use. Retrying with a random free port...`);
      server = Bun.serve({ port: 0, fetch: fetchHandler });
    } else {
      throw e;
    }
  }

  // eslint-disable-next-line no-console
  console.log(`[local-esm-cdn] Serving PIE modules from: ${pieElementsNgPath}`);
  // eslint-disable-next-line no-console
  console.log(`[local-esm-cdn] Listening on: http://localhost:${server.port}`);
  // eslint-disable-next-line no-console
  console.log(`[local-esm-cdn] Rewriting external imports to: ${esmShBaseUrl}`);

  if (selfTest) {
    try {
      const res = await fetch(`http://localhost:${server.port}/health`);
      const body = await res.text();
      // eslint-disable-next-line no-console
      console.log(`[local-esm-cdn] SELF_TEST /health status=${res.status}`);
      // eslint-disable-next-line no-console
      console.log(body.slice(0, 500));
    } finally {
      server.stop(true);
    }
  }
}

void main();
