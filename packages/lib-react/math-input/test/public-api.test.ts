import { describe, expect, it, vi } from 'vitest';

vi.mock('@pie-framework/mathquill', () => ({
  default: {
    getInterface: () => ({
      registerEmbed: vi.fn(),
      StaticMath: vi.fn(),
    }),
  },
}));

describe('math-input public API', () => {
  it('exports MathQuill embed helpers used by synced math elements', async () => {
    const mathInput = await import('../src/index');

    expect(typeof mathInput.registerEmbed).toBe('function');
    expect(typeof mathInput.applyStaticMath).toBe('function');
  });
});
