import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { globSync } from 'glob';

const VALID_BUMPS = new Set(['patch', 'minor', 'major']);

const usage = () => {
  console.log(`Usage:
  node scripts/create-package-changeset.mjs --packages <pkg1,pkg2> --type <patch|minor|major> --summary "<text>"

Options:
  --packages   Comma-separated package names (or repeat --package)
  --package    Single package name (repeatable)
  --type       Version bump type (default: patch)
  --summary    Changeset summary text
  --dry-run    Validate and print changeset content without writing file
`);
};

const parseArgs = (argv) => {
  const args = {
    packageNames: [],
    type: 'patch',
    summary: '',
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      usage();
      process.exit(0);
    }
    if (arg === '--dry-run') {
      args.dryRun = true;
      continue;
    }
    if (arg === '--type') {
      args.type = String(argv[++i] || '').trim();
      continue;
    }
    if (arg === '--summary') {
      args.summary = String(argv[++i] || '').trim();
      continue;
    }
    if (arg === '--packages') {
      const value = String(argv[++i] || '').trim();
      args.packageNames.push(
        ...value
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean)
      );
      continue;
    }
    if (arg === '--package') {
      const value = String(argv[++i] || '').trim();
      if (value) args.packageNames.push(value);
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  args.packageNames = [...new Set(args.packageNames)];
  return args;
};

const loadWorkspacePackages = (repoRoot) => {
  const rootPackage = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'));
  const workspacePatterns = Array.isArray(rootPackage.workspaces) ? rootPackage.workspaces : [];

  const packageJsonPaths = new Set();
  for (const workspacePattern of workspacePatterns) {
    const matches = globSync(join(workspacePattern, 'package.json'), {
      cwd: repoRoot,
      absolute: true,
      ignore: ['**/node_modules/**'],
    });
    for (const match of matches) packageJsonPaths.add(match);
  }

  const byName = new Map();
  for (const packageJsonPath of packageJsonPaths) {
    const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    if (!pkg?.name) continue;
    byName.set(pkg.name, {
      name: pkg.name,
      private: pkg.private === true,
      version: pkg.version || '0.0.0',
      packageJsonPath,
    });
  }
  return byName;
};

const repoRoot = process.cwd();
const args = parseArgs(process.argv.slice(2));

if (!VALID_BUMPS.has(args.type)) {
  throw new Error(`--type must be one of: ${Array.from(VALID_BUMPS).join(', ')}`);
}

if (args.packageNames.length === 0) {
  usage();
  throw new Error('At least one package is required. Use --packages or --package.');
}

if (!args.summary) {
  throw new Error('--summary is required.');
}

const workspacePackages = loadWorkspacePackages(repoRoot);
const missing = args.packageNames.filter((name) => !workspacePackages.has(name));
if (missing.length > 0) {
  throw new Error(`Unknown package(s): ${missing.join(', ')}`);
}

const privatePackages = args.packageNames.filter((name) => workspacePackages.get(name)?.private);
if (privatePackages.length > 0) {
  throw new Error(
    `Cannot create publish changeset for private package(s): ${privatePackages.join(', ')}`
  );
}

const frontmatterLines = args.packageNames
  .sort()
  .map((name) => `  "${name}": ${args.type}`)
  .join('\n');
const content = `---\n${frontmatterLines}\n---\n\n${args.summary}\n`;

if (args.dryRun) {
  console.log(content);
  process.exit(0);
}

const changesetDir = join(repoRoot, '.changeset');
mkdirSync(changesetDir, { recursive: true });

const timestamp = new Date()
  .toISOString()
  .replace(/[-:.TZ]/g, '')
  .slice(0, 14);
const slugSeed = args.packageNames
  .sort()
  .slice(0, 2)
  .join('-')
  .replace(/[^a-zA-Z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .toLowerCase()
  .slice(0, 36);
const filename = `${timestamp}-${slugSeed || 'release'}.md`;
const filePath = join(changesetDir, filename);

writeFileSync(filePath, content, 'utf8');
console.log(`[changeset] Created ${filePath}`);
console.log(`[changeset] Packages: ${args.packageNames.join(', ')}`);
console.log(`[changeset] Bump: ${args.type}`);
