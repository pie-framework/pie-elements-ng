import { describe, expect, it, vi } from 'vitest';

vi.mock('@pie-framework/mathquill', () => ({
  default: {
    getInterface: () => ({
      registerEmbed: vi.fn(),
      StaticMath: vi.fn(),
    }),
  },
}));

// The first import loads math-input's module graph, which takes seconds on a busy machine.
describe('math-input public API', { timeout: 30_000 }, () => {
  it('exports MathQuill embed helpers used by math elements', async () => {
    const mathInput = await import('../src/index');

    expect(typeof mathInput.registerEmbed).toBe('function');
    expect(typeof mathInput.applyStaticMath).toBe('function');
  });

  it('takes the language that names the answer fields', async () => {
    const { mq } = await import('../src/index');

    expect(mq.Static.propTypes).toHaveProperty('language');
    expect(mq.Input.propTypes).toHaveProperty('language');
  });
});
