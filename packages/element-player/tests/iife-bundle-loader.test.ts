import { describe, expect, it } from 'vitest';
import { IifeBundleLoadError, loadIifePackage } from '../src/lib/iife-bundle-loader';

describe('iife-bundle-loader retry behavior', () => {
  it('retries transient script load failures until success', async () => {
    let registryAttempts = 0;
    const statuses: unknown[] = [];

    const result = await loadIifePackage({
      packageName: '@pie-element/hotspot',
      version: '1.0.0',
      endpoint: '/api/bundle',
      iifeBundleRetry: { retryDelayMs: 1, timeoutMs: 100 },
      onRetryStatus: (status) => statuses.push(status),
      adapters: {
        buildClient: {
          startBuild: async () => ({ buildId: 'build-1' }),
          waitForBuildResult: async () => ({
            success: true,
            bundles: { clientPlayer: 'https://example.com/client-player.js' },
            hash: 'hash-1',
            duration: 11,
          }),
        },
        registryClient: {
          load: async () => {
            registryAttempts += 1;
            if (registryAttempts < 3) {
              throw new IifeBundleLoadError(
                'SCRIPT_LOAD_FAILED',
                `simulated transient 503 #${registryAttempts}`
              );
            }
            return {
              '@pie-element/hotspot': {
                Element: class {} as unknown as CustomElementConstructor,
              },
            };
          },
        },
      },
    });

    expect(result.pkg).toBeTruthy();
    expect(registryAttempts).toBe(3);
    expect(statuses.length).toBeGreaterThanOrEqual(2);
    expect((statuses.at(-1) as any)?.state).toBe('completed');
  });

  it('fails after retry timeout with terminal error', async () => {
    const statuses: unknown[] = [];

    await expect(
      loadIifePackage({
        packageName: '@pie-element/hotspot',
        version: '1.0.0',
        endpoint: '/api/bundle',
        iifeBundleRetry: { retryDelayMs: 5, timeoutMs: 12 },
        onRetryStatus: (status) => statuses.push(status),
        adapters: {
          buildClient: {
            startBuild: async () => ({ buildId: 'build-1' }),
            waitForBuildResult: async () => ({
              success: true,
              bundles: { clientPlayer: 'https://example.com/client-player.js' },
              hash: 'hash-1',
              duration: 9,
            }),
          },
          registryClient: {
            load: async () => {
              throw new IifeBundleLoadError('SCRIPT_LOAD_FAILED', 'simulated persistent 503');
            },
          },
        },
      })
    ).rejects.toThrow('timed out');

    expect(statuses.length).toBeGreaterThanOrEqual(1);
    expect((statuses.at(-1) as any)?.state).toBe('timeout');
  });

  it('emits cancelled status and abort error when signal aborts', async () => {
    const statuses: unknown[] = [];
    const controller = new AbortController();

    const promise = loadIifePackage({
      packageName: '@pie-element/hotspot',
      version: '1.0.0',
      endpoint: '/api/bundle',
      iifeBundleRetry: { retryDelayMs: 10, timeoutMs: 1000 },
      signal: controller.signal,
      onRetryStatus: (status) => statuses.push(status),
      adapters: {
        buildClient: {
          startBuild: async () => ({ buildId: 'build-1' }),
          waitForBuildResult: async () => ({
            success: true,
            bundles: { clientPlayer: 'https://example.com/client-player.js' },
            hash: 'hash-1',
            duration: 9,
          }),
        },
        registryClient: {
          load: async () => {
            controller.abort();
            throw new IifeBundleLoadError('LOAD_ABORTED', 'IIFE bundle load aborted');
          },
        },
      },
    });

    await expect(promise).rejects.toThrow('aborted');
    expect((statuses.at(-1) as any)?.state).toBe('cancelled');
  });
});
