import { spawn } from 'node:child_process';

const usage = () => {
  console.log(`Usage:
  node scripts/release-publish-selective.mjs --packages <pkg1,pkg2>

Examples:
  bun run release:publish:packages -- --packages @pie-element/mc-populated-blank
  bun run release:publish:packages -- --packages @pie-element/charting,@pie-element/multiple-choice
`);
};

const parsePackages = (argv) => {
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      usage();
      process.exit(0);
    }
    if (arg === '--packages') {
      const value = String(argv[i + 1] || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      return [...new Set(value)];
    }
  }
  return [];
};

const packages = parsePackages(process.argv.slice(2));
if (packages.length === 0) {
  usage();
  throw new Error('Missing required --packages argument.');
}

const child = spawn('bun', ['run', 'release:publish'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    RELEASE_PACKAGES: packages.join(','),
  },
});

child.on('close', (code) => {
  process.exit(code ?? 1);
});

child.on('error', (error) => {
  console.error(error);
  process.exit(1);
});
