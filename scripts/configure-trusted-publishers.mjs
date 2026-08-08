#!/usr/bin/env node
/**
 * Configure npm trusted publishers (OIDC) for every publishable package in this repo.
 *
 * The npm docs for trusted publishers present the npm website as the only way to set
 * this up. That is out of date: npm 12 ships `npm trust`, so it is scriptable.
 *
 *   npm trust github <pkg> --file <workflow> --repository <owner/repo> \
 *                          --allow-publish --allow-stage-publish
 *   npm trust list <pkg>
 *   npm trust revoke <pkg> --id=<trust-id>
 *
 * The package list is derived from the workspace rather than hardcoded. Versioning here is
 * independent (see .changeset/config.json), so a release publishes only the packages that
 * changed — which makes a missing trusted publisher easy to miss for months, until the one
 * release that happens to include that package fails or silently falls back to a token. A
 * stale hardcoded list is exactly how that would happen unnoticed.
 *
 * Shared packages — read this before running --apply:
 *
 * This repo does not own most of the package names it publishes. `@pie-element/*` and
 * `@pie-lib/*` are also published by pie-framework/pie-elements and pie-framework/pie-lib,
 * which are both still active: this repo ships `-next.N` prereleases (e.g.
 * @pie-element/multiple-choice 13.2.2-next.5) while those repos ship the stable versions of
 * the same names (13.3.5). As of 2026-07-31, 50 of the 74 packages here already have a
 * trusted publisher belonging to one of those repos, bound to their `ci.yml`, and 45 of
 * them published a stable release through it that same day.
 *
 * npm permits exactly ONE trusted publisher per package. So those 50 cannot be claimed
 * here without revoking a record that is actively releasing, and this repo can only
 * configure the ~23 packages that exist solely in pie-elements-ng. Until that changes,
 * releases here must keep using NPM_TOKEN: OIDC applies to a whole publish run, so a
 * cutover would fail every package still owned elsewhere.
 *
 * Who publishes a given package can be checked without any 2FA, because the registry
 * records it — `_npmUser.trustedPublisher.oidcConfigId` on a published version names the
 * trusted-publisher record that produced it:
 *
 *   curl -s https://registry.npmjs.org/@pie-lib%2Frender-ui \
 *     | jq '.versions["6.1.3"]._npmUser'
 *
 * Usage (from the repo root):
 *   node scripts/configure-trusted-publishers.mjs             # dry run, changes nothing
 *   node scripts/configure-trusted-publishers.mjs --apply     # configure
 *   node scripts/configure-trusted-publishers.mjs --verify    # assert config, per package
 *   node scripts/configure-trusted-publishers.mjs --apply --only @pie-element/shared-types
 *   node scripts/configure-trusted-publishers.mjs --apply --only pkg-a,pkg-b
 *
 * --verify parses `npm trust list --json` and asserts each package is bound to this
 * repository and its release workflow. It does not treat a successful read as a pass: npm
 * exits 0 and prints an empty list for a package with no trusted publisher at all, so exit
 * status alone reports an unconfigured repo as healthy. That mistake shipped once in
 * pie-players — a "37/37 verified" run was followed by a release in which 35 of 36
 * packages failed with ENEEDAUTH.
 *
 * Requirements:
 * - npm >= 12, which itself requires Node ^22.22.2 || ^24.15.0 || >=26.0.0. npm only
 *   warns on older Node, but this writes security configuration to a production account,
 *   so an unsupported runtime is treated as an error.
 * - An authenticated npm session (`npm login`). This script never handles credentials.
 * - Both reading and writing trusted publisher config are 2FA-protected, and npm does
 *   not reuse the authentication between invocations, so expect an OTP prompt per
 *   package. Per npm's 2026-07-08 changelog, tokens that bypass 2FA lose the ability to
 *   change trusted publishing configuration from early August 2026, so this is
 *   necessarily interactive rather than token-driven.
 */

import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ROOT = process.cwd();

/**
 * The workflow that publishes every package in this repo. npm permits exactly ONE trusted
 * publisher per package, and release.yml is the only publish path here, so all packages
 * are registered against it.
 */
const WORKFLOW = 'release.yml';

/**
 * This is a local, one-time operator tool — never a CI step.
 *
 * Two reasons it cannot work in Actions:
 *
 * 1. Every `npm trust` operation, read or write, is 2FA-protected and prompts for an OTP
 *    (npm does not reuse the authentication between invocations). There is no one to
 *    answer that on a runner.
 * 2. Per npm's 2026-07-08 changelog, tokens that bypass 2FA lose the ability to change
 *    trusted publishing configuration from early August 2026, so a token cannot stand in
 *    for the human either.
 *
 * That is also why it does not need to run in CI: configuring a trusted publisher happens
 * once per package, after which the release workflow publishes via OIDC using the
 * short-lived id-token GitHub mints for it — no npm credentials and no `npm trust` calls
 * are involved in a release.
 *
 * Failing loudly here beats failing halfway through the package list at an invisible
 * prompt.
 */
if (process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true') {
  console.error(
    '\n[trusted-publishers] this script is interactive and must not run in CI.\n' +
      '  Every `npm trust` operation requires a one-time password, and from early August 2026\n' +
      '  tokens that bypass 2FA can no longer change trusted publishing configuration.\n' +
      '  Configure trusted publishers once from a local terminal; releases then publish via\n' +
      '  OIDC without any npm credentials.'
  );
  process.exit(1);
}

function fail(msg, extra) {
  console.error(`\n[trusted-publishers] ${msg}`);
  if (extra) console.error(extra);
  process.exit(1);
}

const mode = process.argv.includes('--apply')
  ? 'apply'
  : process.argv.includes('--verify')
    ? 'verify'
    : 'dry-run';

/**
 * --only <pkg>[,<pkg>...] limits the run to the named packages.
 *
 * A list is essential in this repo, not a convenience: 50 of the 74 packages already have
 * a trusted publisher belonging to pie-framework/pie-elements or pie-framework/pie-lib
 * (see the "Shared packages" note at the top of this file), so only a subset can be
 * claimed here and the rest must be skipped explicitly.
 *
 * This exists because `--dry-run` is not the rehearsal it appears to be: `npm trust
 * github --dry-run` exits 0 even for a package that does not exist, so a clean dry run
 * across every package proves the command lines are well-formed and nothing more. It
 * does not prove the packages exist, that you hold permission on them, or that npm will
 * accept the configuration.
 *
 * Configuration, unlike publishing, can be done incrementally — so the real rehearsal is
 * to apply to one package and read it back:
 *
 *   node scripts/configure-trusted-publishers.mjs --apply  --only @pie-element/shared-types
 *   node scripts/configure-trusted-publishers.mjs --verify --only @pie-element/shared-types
 */
const onlyIndex = process.argv.indexOf('--only');
const onlyArg = onlyIndex !== -1 ? process.argv[onlyIndex + 1] : null;
if (onlyIndex !== -1 && (!onlyArg || onlyArg.startsWith('--'))) {
  fail('--only requires a package name, e.g. --only @pie-element/shared-types');
}
const only = onlyArg
  ? onlyArg
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  : null;

const rootManifestPath = path.join(ROOT, 'package.json');
if (!existsSync(rootManifestPath)) fail('run from the repository root (package.json not found).');
const rootManifest = JSON.parse(readFileSync(rootManifestPath, 'utf8'));

/** owner/repo, taken from repository.url so it cannot drift from what npm validates. */
function repositorySlug() {
  const url = rootManifest.repository?.url ?? '';
  const m = url.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
  if (!m) fail(`could not parse owner/repo from repository.url: ${JSON.stringify(url)}`);
  return `${m[1]}/${m[2]}`;
}

/**
 * Expand one workspace glob to directories.
 *
 * This repo's `workspaces` mixes three shapes — plain globs (`packages/lib-react/*`),
 * literal paths (`packages/element-player`, `tools/cli`) and a nested glob (`packages/elements-react/
 * *​/demo`) — so a `endsWith("/*")` shortcut would silently skip most of the repo, including
 * every package under packages/shared, packages/element-*, print-player and tools/cli. A
 * missed package is a package that publishes without a trusted publisher, which is exactly
 * the failure this script exists to prevent, so `*` is expanded at any position.
 */
function expandWorkspaceGlob(glob) {
  let current = [ROOT];
  for (const segment of glob.split('/')) {
    const next = [];
    for (const dir of current) {
      if (segment === '*') {
        if (!existsSync(dir)) continue;
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
          if (entry.isDirectory()) next.push(path.join(dir, entry.name));
        }
      } else {
        next.push(path.join(dir, segment));
      }
    }
    current = next;
  }
  return current;
}

/** Publishable workspace packages, derived rather than hardcoded so it cannot go stale. */
function publishablePackages() {
  const dirs = new Set();
  for (const entry of rootManifest.workspaces ?? []) {
    for (const dir of expandWorkspaceGlob(entry)) dirs.add(dir);
  }

  const found = [];
  for (const dir of dirs) {
    const manifestPath = path.join(dir, 'package.json');
    if (!existsSync(manifestPath)) continue;
    const pkg = JSON.parse(readFileSync(manifestPath, 'utf8'));
    if (pkg.private || !pkg.name) continue;
    found.push({ name: pkg.name, workflow: WORKFLOW });
  }
  return found.sort((a, b) => a.name.localeCompare(b.name));
}

function nodeSupportsNpm12(version) {
  const [maj, min] = version.replace(/^v/, '').split('.').map(Number);
  return (maj === 22 && min >= 22) || (maj === 24 && min >= 15) || maj >= 26;
}

if (!nodeSupportsNpm12(process.version)) {
  fail(
    `this script needs a Node that npm 12 supports (^22.22.2 || ^24.15.0 || >=26.0.0); running ${process.version}.`,
    'Install one (e.g. `nvm install 24.15.0`) and re-run with it.'
  );
}

/**
 * Resolve an npm >= 12 without touching the globally installed npm.
 *
 * `npm trust` needs npm 12, but npm 12 also changes install-time defaults (dependency
 * lifecycle scripts, git deps and remote tarballs are all off by default). Forcing a
 * global upgrade just to run a one-off configuration task would push that change onto
 * everything else on the machine, so npm 12 is bootstrapped into a temp prefix and
 * invoked directly instead.
 */
function resolveNpm12() {
  const local = execFileSync('npm', ['--version'], { encoding: 'utf8' }).trim();
  if (Number(local.split('.')[0]) >= 12) return { argv: ['npm'], version: local };

  const prefix = path.join(os.tmpdir(), 'pie-elements-ng-npm12');
  const cli = path.join(prefix, 'node_modules', 'npm', 'bin', 'npm-cli.js');
  if (!existsSync(cli)) {
    console.log(`bootstrapping npm@^12 into ${prefix} (global npm ${local} left untouched) ...`);
    mkdirSync(prefix, { recursive: true });
    const res = spawnSync('npm', ['install', 'npm@^12', '--silent', '--no-audit', '--no-fund'], {
      cwd: prefix,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    if (res.status !== 0 || !existsSync(cli)) {
      fail('failed to bootstrap npm@^12.', `${res.stdout ?? ''}${res.stderr ?? ''}`);
    }
  }
  const version = execFileSync(process.execPath, [cli, '--version'], {
    encoding: 'utf8',
  }).trim();
  return { argv: [process.execPath, cli], version };
}

const { argv: NPM, version: npmVersion } = resolveNpm12();
if (Number(npmVersion.split('.')[0]) < 12) {
  fail(`resolved npm ${npmVersion}, which does not provide \`npm trust\`; npm >= 12 is required.`);
}

/**
 * Run the resolved npm 12.
 *
 * Three stdio shapes, because 2FA constrains what may be captured:
 *
 * - `interactive: true` inherits all three streams. Required for writes: npm asks for
 *   confirmation and an OTP and waits for input.
 * - `captureStdout: true` inherits stdin and stderr but pipes stdout. npm 12 splits these
 *   cleanly — the `--json` payload goes to stdout, while the 2FA prompt ("Press ENTER to
 *   open in the browser...") and the auth URL go to stderr. So the prompt still reaches
 *   the terminal and ENTER still works, and the payload is still parseable. Verified
 *   against npm 12.0.2.
 * - default pipes both, for non-interactive reads like `whoami`.
 */
function npm(args, { interactive = false, captureStdout = false } = {}) {
  const stdio = interactive
    ? 'inherit'
    : captureStdout
      ? ['inherit', 'pipe', 'inherit']
      : ['inherit', 'pipe', 'pipe'];
  return spawnSync(NPM[0], [...NPM.slice(1), ...args], {
    encoding: 'utf8',
    stdio,
  });
}

/**
 * The trusted-publisher record `npm trust list --json` reports for a package, or null.
 *
 * npm exits 0 and prints an empty list for a package with no trusted publisher, so the
 * exit status says only "the read worked" — it is not evidence that publishing will
 * authenticate. An earlier version of this script equated the two. In pie-players that
 * produced a "37/37 verified" report for a repo where exactly one package was configured,
 * and the release that followed failed 35 of 36 publishes with ENEEDAUTH.
 */
function readTrustRecord(pkg) {
  const res = npm(['trust', 'list', pkg, '--json'], { captureStdout: true });
  const raw = (res.stdout ?? '').trim();
  if (res.status !== 0) {
    let detail = raw;
    try {
      detail = JSON.parse(raw)?.error?.summary ?? raw;
    } catch {}
    return { error: detail || `npm exited ${res.status}` };
  }
  let doc;
  try {
    doc = raw ? JSON.parse(raw) : null;
  } catch {
    return { error: `could not parse npm output: ${raw.slice(0, 200)}` };
  }
  // npm has shipped both a bare array and an object wrapper here; accept either, and
  // tolerate a single object, rather than depending on one undocumented shape.
  const list = Array.isArray(doc)
    ? doc
    : Array.isArray(doc?.publishers)
      ? doc.publishers
      : doc && typeof doc === 'object' && doc.type
        ? [doc]
        : [];
  return { records: list.filter((r) => r?.type === 'github') };
}

/**
 * Is `record` bound to this repo's release workflow?
 *
 * Deliberately checks repository and workflow file only. `permissions` is reported
 * verbatim instead of being asserted: the legacy records in this scope read back as
 * `['createPackage']`, which is not a string `--allow-publish` obviously produces, so
 * asserting on that vocabulary would risk failing a record that publishes fine.
 */
function recordMatches(record, workflow) {
  return record.repository === slug && record.file === workflow;
}

function describeRecord(record) {
  const perms = Array.isArray(record.permissions) ? record.permissions.join(',') : '?';
  return `${record.repository} :: ${record.file} [${perms}]`;
}

const whoami = npm(['whoami']);
if (whoami.status !== 0) {
  fail(
    'not authenticated to npm. Run `npm login` first (this script does not handle credentials).',
    `${whoami.stdout ?? ''}${whoami.stderr ?? ''}`.trim()
  );
}
const user = (whoami.stdout ?? '').trim();

const slug = repositorySlug();
const allPackages = publishablePackages();
if (allPackages.length === 0) fail('no publishable packages found.');

let packages = allPackages;
if (only) {
  const unknown = only.filter((n) => !allPackages.some((p) => p.name === n));
  if (unknown.length > 0) {
    fail(
      `--only named ${unknown.length === 1 ? 'a package' : 'packages'} this repo does not publish: ${unknown.join(', ')}`,
      `Known packages:\n${allPackages.map((p) => `  ${p.name}`).join('\n')}`
    );
  }
  packages = allPackages.filter((p) => only.includes(p.name));
}

const workflows = [...new Set(packages.map((p) => p.workflow))].sort();

console.log(`node: ${process.version}   npm: ${npmVersion}   user: ${user}`);
console.log(`repo: ${slug}   workflows: ${workflows.join(', ')}`);
console.log(`mode: ${mode}   packages: ${packages.length}${only ? ` (--only ${only})` : ''}`);

if (mode === 'dry-run') {
  console.log(
    '\n  note: `npm trust github --dry-run` exits 0 even for a nonexistent package, so a\n' +
      '  clean dry run confirms the arguments are well-formed, not that the configuration\n' +
      '  would be accepted. Rehearse with: --apply --only <pkg>, then --verify --only <pkg>.'
  );
}
if (mode === 'apply') {
  console.log(
    `\n  note: trusted publishing means anyone who can write to ${slug} and trigger\n` +
      `  ${workflows.join(' / ')} can publish these packages. Consider gating the release job\n` +
      '  behind a protected GitHub Environment (npm trust github --environment <name>) if\n' +
      '  that is broader than you want. The environment forms part of each trusted-publisher\n' +
      '  record, so adopting it later means reconfiguring every package.'
  );
}
console.log('');

let ok = 0;
const problems = [];
/** Packages --verify found to have no publisher at all, i.e. the ones --apply can fix. */
const unconfigured = [];
/** Packages whose slot is held by another repo's record. */
const foreign = [];

for (const { name: pkg, workflow } of packages) {
  // Every `npm trust` call is 2FA-protected and npm does not carry the authentication
  // across invocations — an apply and a list seven minutes apart each demanded their own
  // OTP — so expect one auth round trip per package in both apply and verify.
  if (mode === 'verify') {
    console.log(`\n  --- ${pkg}  (expecting ${slug} :: ${workflow})`);
    const { records, error } = readTrustRecord(pkg);
    if (error) {
      console.log(`  ${pkg.padEnd(52)} READ FAILED`);
      problems.push([pkg, error]);
      continue;
    }
    const match = records.find((r) => recordMatches(r, workflow));
    if (match) {
      console.log(`  ${pkg.padEnd(52)} CONFIGURED  ${describeRecord(match)}`);
      ok++;
    } else if (records.length > 0) {
      // npm permits only ONE trusted publisher per package, so a record bound to some
      // other repo/workflow is not merely wrong, it occupies the slot this repo needs.
      // Expected for the ~50 packages still released by pie-elements / pie-lib.
      console.log(`  ${pkg.padEnd(52)} WRONG TARGET  ${records.map(describeRecord).join('; ')}`);
      foreign.push(pkg);
      problems.push([
        pkg,
        `trusted publisher belongs to another repo: ${records.map(describeRecord).join('; ')} — ` +
          'npm allows one publisher per package, so migrating this package means revoking ' +
          `that record (\`${NPM.join(' ')} trust revoke ${pkg} <id>\`) and removing OIDC ` +
          'publishing from the repo that currently owns it',
      ]);
    } else {
      console.log(`  ${pkg.padEnd(52)} NOT CONFIGURED`);
      problems.push([
        pkg,
        'no trusted publisher — publishing from CI would fail with ENEEDAUTH; run --apply',
      ]);
      unconfigured.push(pkg);
    }
    continue;
  }

  const args = [
    'trust',
    'github',
    pkg,
    '--file',
    workflow,
    '--repository',
    slug,
    '--allow-publish',
    '--allow-stage-publish',
    '--yes',
    ...(mode === 'dry-run' ? ['--dry-run'] : []),
  ];

  if (mode === 'apply') {
    console.log(`\n  --- ${pkg}  (${workflow})`);
    const res = npm(args, { interactive: true });
    if (res.status === 0) {
      console.log(`  ${pkg.padEnd(52)} configured`);
      ok++;
    } else {
      console.log(`  ${pkg.padEnd(52)} FAILED (exit ${res.status})`);
      problems.push([
        pkg,
        'see npm output above — note npm permits only ONE trusted publisher per package, ' +
          `so this is expected if it is already configured (including by another repo); confirm with: ${NPM.join(' ')} trust list ${pkg}`,
      ]);
    }
    continue;
  }

  const res = npm(args);
  const out = `${res.stdout ?? ''}${res.stderr ?? ''}`;
  if (res.status === 0) {
    console.log(`  ${pkg.padEnd(52)} dry-run ok  (${workflow})`);
    ok++;
  } else {
    console.log(`  ${pkg.padEnd(52)} FAILED`);
    problems.push([pkg, out.trim().split('\n').slice(0, 3).join(' | ')]);
  }
}

console.log(`\n  ok: ${ok}/${packages.length}   problems: ${problems.length}`);
for (const [pkg, why] of problems) console.log(`    ${pkg}: ${why}`);

if (unconfigured.length > 0) {
  console.log(
    `\n  to configure the ${unconfigured.length} package(s) with no publisher:\n` +
      `    bun run trusted-publishers -- --apply --only ${unconfigured.join(',')}`
  );
}
if (foreign.length > 0) {
  console.log(
    `\n  ${foreign.length} package(s) are owned by another repo's trusted publisher and cannot be\n` +
      '  claimed here without breaking that repo. See the "Shared packages" note at the top\n' +
      '  of this file.'
  );
}

// Deliberately NOT advising "now delete NPM_TOKEN". Deleting the secret flips the release
// workflow's `auto` mode to oidc for EVERY package in the same publish run, and a package
// without a usable trusted publisher then fails with ENEEDAUTH. Because most of this
// repo's packages are still owned by pie-elements / pie-lib, that would turn every release
// into a partial one. pie-players learned this the expensive way: its token was deleted
// while 36 of 37 packages were unconfigured, and the next release published exactly one
// package. The token stays until `--verify` reports every package CONFIGURED.
if (mode === 'apply') {
  console.log(
    '\n  next: re-run with --verify. Do NOT delete the NPM_TOKEN repo secret yet — `auto`\n' +
      '  mode would then resolve to oidc for the whole publish run, and every package that\n' +
      '  is still owned by pie-elements / pie-lib would fail with ENEEDAUTH. The token can\n' +
      '  only be removed once --verify reports CONFIGURED for every package.'
  );
}

process.exit(problems.length === 0 ? 0 : 1);
