import { execSync } from 'node:child_process';

test('vitest suite', () => {
  execSync('bun run build', { stdio: 'inherit' });
  execSync('bun run test', { stdio: 'inherit' });
}, 120_000);
