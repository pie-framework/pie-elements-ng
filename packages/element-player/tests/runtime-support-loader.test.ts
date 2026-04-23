import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadUnifiedPlayer } from '../src/lib/unified-player-loader';

const { loadElementMock, loadControllerMock, loadRuntimeSupportMock, loadIifePackageMock } =
  vi.hoisted(() => ({
    loadElementMock: vi.fn(),
    loadControllerMock: vi.fn(),
    loadRuntimeSupportMock: vi.fn(),
    loadIifePackageMock: vi.fn(),
  }));

vi.mock('../src/lib/element-loader', () => ({
  configureElementModuleResolver: vi.fn(),
  loadElement: loadElementMock,
  loadController: loadControllerMock,
  loadRuntimeSupport: loadRuntimeSupportMock,
}));

vi.mock('../src/lib/iife-bundle-loader', () => ({
  DEFAULT_IIFE_BUNDLE_RETRY_CONFIG: { timeoutMs: 10_000, retryMs: 500, maxAttempts: 20 },
  loadIifePackage: loadIifePackageMock,
}));

describe('runtime-support strategy checks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const customElementsRegistry = new Map<string, unknown>();
    vi.stubGlobal('customElements', {
      get: (name: string) => customElementsRegistry.get(name),
      define: (name: string, value: unknown) => {
        customElementsRegistry.set(name, value);
      },
      whenDefined: async () => undefined,
    });
    loadElementMock.mockResolvedValue(undefined);
    loadControllerMock.mockResolvedValue({ model: async () => ({}) });
    loadIifePackageMock.mockResolvedValue({
      pkg: {
        Element: class TestElement {},
        controller: { model: async () => ({}) },
      },
      meta: { source: 'local', key: 'x', hash: 'hash' },
    });
  });

  it('skips checks when mode is off', async () => {
    const result = await loadUnifiedPlayer({
      strategy: 'esm',
      view: 'delivery',
      elementName: 'simple-cloze',
      packageName: '@pie-element/simple-cloze',
      elementVersion: 'off-mode',
      runtimeSupportCheck: 'off',
    });

    expect(result.strategy).toBe('esm');
    expect(result.runtimeSupportDiagnostic?.status).toBe('skipped');
    expect(loadRuntimeSupportMock).not.toHaveBeenCalled();
  });

  it('falls back to legacy assumptions when metadata is missing in on mode', async () => {
    loadRuntimeSupportMock.mockRejectedValue(new Error('Cannot find module runtime-support'));

    const result = await loadUnifiedPlayer({
      strategy: 'iife',
      view: 'delivery',
      elementName: 'simple-cloze',
      packageName: '@pie-element/simple-cloze',
      elementVersion: 'on-missing',
      runtimeSupportCheck: 'on',
    });

    expect(result.strategy).toBe('iife');
    expect(result.runtimeSupportDiagnostic?.status).toBe('missing');
  });

  it('does not fail when metadata is missing in on mode', async () => {
    loadRuntimeSupportMock.mockRejectedValue(new Error('Cannot find module runtime-support'));

    const result = await loadUnifiedPlayer({
      strategy: 'esm',
      view: 'delivery',
      elementName: 'simple-cloze',
      packageName: '@pie-element/simple-cloze',
      elementVersion: 'on-missing-2',
      runtimeSupportCheck: 'on',
    });

    expect(result.strategy).toBe('esm');
    expect(result.runtimeSupportDiagnostic?.status).toBe('missing');
  });

  it('does not change strategy when metadata says strategy is unsupported', async () => {
    loadRuntimeSupportMock.mockResolvedValue({
      schemaVersion: 1,
      supports: {
        iife: { delivery: false },
        esm: { delivery: true },
      },
    });

    const result = await loadUnifiedPlayer({
      strategy: 'iife',
      view: 'delivery',
      elementName: 'simple-cloze',
      packageName: '@pie-element/simple-cloze',
      elementVersion: 'on-unsupported',
      runtimeSupportCheck: 'on',
    });

    expect(result.requestedStrategy).toBe('iife');
    expect(result.strategy).toBe('iife');
    expect(loadIifePackageMock).toHaveBeenCalled();
    expect(loadElementMock).not.toHaveBeenCalled();
  });
});
