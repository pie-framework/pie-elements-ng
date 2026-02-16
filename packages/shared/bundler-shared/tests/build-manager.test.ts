import { describe, expect, it } from 'vitest';
import { BuildManager } from '../src/build-manager';

describe('BuildManager', () => {
  it('single-flights same hash requests', async () => {
    const manager = new BuildManager<string>();
    let runCount = 0;

    const runner = async () => {
      runCount += 1;
      await new Promise((resolve) => setTimeout(resolve, 30));
      return 'ok';
    };

    const [a, b, c] = await Promise.all([
      manager.run('same-hash', runner),
      manager.run('same-hash', runner),
      manager.run('same-hash', runner),
    ]);

    expect(a).toBe('ok');
    expect(b).toBe('ok');
    expect(c).toBe('ok');
    expect(runCount).toBe(1);
  });

  it('runs different hashes concurrently', async () => {
    const manager = new BuildManager<string>();
    let active = 0;
    let maxActive = 0;

    const makeRunner = (value: string) => async () => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => setTimeout(resolve, 40));
      active -= 1;
      return value;
    };

    const [a, b] = await Promise.all([
      manager.run('hash-a', makeRunner('a')),
      manager.run('hash-b', makeRunner('b')),
    ]);

    expect(a).toBe('a');
    expect(b).toBe('b');
    expect(maxActive).toBeGreaterThanOrEqual(2);
  });
});
