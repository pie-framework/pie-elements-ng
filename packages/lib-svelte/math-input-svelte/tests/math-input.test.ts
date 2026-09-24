import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { flushSync, mount, unmount } from 'svelte';
import { compile } from 'svelte/compiler';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MathField from '../src/MathField.svelte';
import StaticMath from '../src/StaticMath.svelte';
import { reactiveProps } from './reactive-props.svelte';

const { renderMath } = vi.hoisted(() => ({ renderMath: vi.fn() }));
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath }));

// A string, not a URL object: happy-dom replaces the global `URL`, which `readFileSync` rejects.
const SRC = resolve(dirname(fileURLToPath(import.meta.url)), '../src');

const mounted: Array<ReturnType<typeof mount>> = [];

function render<Props extends Record<string, unknown>>(
  component: Parameters<typeof mount>[0],
  initial: Props
) {
  const target = document.createElement('div');
  document.body.appendChild(target);
  const props = reactiveProps(initial);
  mounted.push(mount(component, { target, props }));
  flushSync();
  return { target, props };
}

afterEach(() => {
  for (const component of mounted.splice(0)) unmount(component);
  document.body.innerHTML = '';
  renderMath.mockReset();
  vi.restoreAllMocks();
});

describe('MathField', () => {
  it('compiles in runes mode', () => {
    for (const file of ['MathField.svelte', 'StaticMath.svelte']) {
      const { metadata } = compile(readFileSync(resolve(SRC, file), 'utf8'), { filename: file });
      expect(metadata.runes, file).toBe(true);
    }
  });

  it('reports each edit through onChange', () => {
    const onChange = vi.fn();
    const { target } = render(MathField, { latex: 'x', onChange });
    const input = target.querySelector('input') as HTMLInputElement;

    input.value = 'x^2';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    expect(onChange).toHaveBeenCalledWith('x^2');
  });

  it('accepts edits without an onChange', () => {
    const { target } = render(MathField, { latex: 'x' });
    const input = target.querySelector('input') as HTMLInputElement;

    input.value = 'x^2';
    expect(() => input.dispatchEvent(new Event('input', { bubbles: true }))).not.toThrow();
  });
});

describe('StaticMath', () => {
  it('hands the LaTeX to the math renderer as inline math', () => {
    const { target } = render(StaticMath, { latex: 'x^2' });
    const span = target.querySelector('span') as HTMLSpanElement;

    expect(span.textContent).toBe('\\(x^2\\)');
    expect(renderMath).toHaveBeenCalledWith(span);
  });

  it('renders again when the LaTeX changes', () => {
    const { target, props } = render(StaticMath, { latex: 'x^2' });
    renderMath.mockClear();

    props.latex = 'y^3';
    flushSync();

    expect(target.querySelector('span')?.textContent).toBe('\\(y^3\\)');
    expect(renderMath).toHaveBeenCalledTimes(1);
  });

  it('reports a MathJax load failure as a warning', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    renderMath.mockImplementation(() => Promise.reject(new Error('Failed to load MathJax')));

    render(StaticMath, { latex: 'x^2' });
    await Promise.resolve();
    await Promise.resolve();

    expect(warn).toHaveBeenCalledWith(
      '[math-input-svelte] MathJax render failed',
      expect.any(Error)
    );
  });
});
