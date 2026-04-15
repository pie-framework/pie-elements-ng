import { spawn } from 'node:child_process';

const usage = () => {
  console.log(`Usage:
  node scripts/release-publish-selective.mjs --packages <pkg1,pkg2>
  node scripts/release-publish-selective.mjs --packages <pkg1,pkg2> [--channel <auto|stable|next|beta>]

Examples:
  bun run release:publish:packages -- --packages @pie-element/mc-populated-blank
  bun run release:publish:packages -- --packages @pie-element/charting,@pie-element/multiple-choice
  bun run release:publish:packages -- --packages @pie-element/charting --channel next
`);
};

const parseArgs = (argv) => {
  const result = {
    packages: [],
    channel: String(process.env.RELEASE_CHANNEL || 'auto')
      .trim()
      .toLowerCase(),
  };

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
      result.packages = [...new Set(value)];
      i += 1;
      continue;
    }
    if (arg === '--channel') {
      result.channel = String(argv[i + 1] || '')
        .trim()
        .toLowerCase();
      i += 1;
      continue;
    }
  }
  return result;
};

const { packages, channel } = parseArgs(process.argv.slice(2));
if (packages.length === 0) {
  usage();
  throw new Error('Missing required --packages argument.');
}
if (!['auto', 'stable', 'next', 'beta'].includes(channel)) {
  throw new Error(`Invalid --channel "${channel}". Expected one of: auto, stable, next, beta.`);
}

const child = spawn('bun', ['run', 'release:publish'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    RELEASE_PACKAGES: packages.join(','),
    RELEASE_CHANNEL: channel,
  },
});

child.on('close', (code) => {
  process.exit(code ?? 1);
});

child.on('error', (error) => {
  console.error(error);
  process.exit(1);
});
