import { describe, expect, it } from 'vitest';
import {
  getPieLibDependencyAugmentations,
  getPieLibDependencyOverride,
  getPieLibSourcePreserveList,
  getPieLibSyncMode,
  getPieLibVitePreset,
  getPostSyncTextPatches,
  PIE_LIB_COMPATIBILITY_APPEND_PATCHES,
  PRESET_IDS,
} from '../src/lib/upstream/sync-presets.js';

describe('sync preset registry', () => {
  it('resolves pie-lib sync mode by package', () => {
    expect(getPieLibSyncMode('math-rendering')).toBe('wrapper');
    expect(getPieLibSyncMode('graphing')).toBe('full-sync');
  });

  it('resolves preserve entries for local-only files', () => {
    expect(getPieLibSourcePreserveList('render-ui')).toEqual(['inline-menu.tsx']);
    expect(getPieLibSourcePreserveList('graphing')).toEqual([]);
  });

  it('resolves pie-lib vite preset by package', () => {
    expect(getPieLibVitePreset('math-rendering')).toBe('math-rendering-wrapper');
    expect(getPieLibVitePreset('test-utils')).toBe('test-utils');
    expect(getPieLibVitePreset('editable-html-tip-tap')).toBe('editable-html-tip-tap');
    expect(getPieLibVitePreset('graphing')).toBe('default');
  });

  it('provides dependency augmentations and overrides', () => {
    expect(getPieLibDependencyAugmentations('graphing')).toEqual({
      '@dnd-kit/core': '^6.3.0',
    });
    expect(getPieLibDependencyAugmentations('charting')).toEqual({
      'd3-time': '^3.1.0',
      'd3-interpolate': '^3.0.1',
      'd3-shape': '^3.2.0',
    });
    expect(getPieLibDependencyAugmentations('render-ui')).toEqual({});

    expect(getPieLibDependencyOverride('math-rendering')).toEqual({
      '@pie-element/shared-math-rendering-mathjax': 'workspace:*',
    });
    expect(getPieLibDependencyOverride('graphing')).toBeNull();
  });

  it('exposes post-sync text patches with stable IDs', () => {
    const root = '/tmp/workspace';
    const patches = getPostSyncTextPatches(root);

    expect(patches.length).toBeGreaterThanOrEqual(6);
    expect(patches.map((p) => p.id)).toContain(PRESET_IDS.testUtilsDeclarationStabilization);
    expect(patches.map((p) => p.id)).toContain(PRESET_IDS.graphingAutosizeInterop);
    expect(patches.map((p) => p.id)).toContain(PRESET_IDS.chartingAutosizeInterop);
    expect(patches.map((p) => p.id)).toContain(PRESET_IDS.graphingDomPropLeakGuard);
    expect(patches.map((p) => p.id)).toContain(PRESET_IDS.previewPromptPropTypesShape);
    expect(patches.map((p) => p.id)).toContain(PRESET_IDS.correctAnswerToggleStyleNormalization);
    expect(patches.every((p) => p.file.startsWith(root))).toBe(true);
  });

  it('tracks compatibility append patches with stable IDs', () => {
    const plotPatch = PIE_LIB_COMPATIBILITY_APPEND_PATCHES.plot;
    expect(plotPatch.id).toBe(PRESET_IDS.plotToolPropTypesCompatibility);
    expect(plotPatch.requiredMarker).toBe('ToolPropTypeFields');
    expect(plotPatch.append).toContain('ToolPropType');
  });
});
