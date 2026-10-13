/**
 * The player wraps an authored table in `.pie-table-scroll`, and the prompt's table
 * styles reach the table through that wrapper as they do without it.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot, type Root } from 'react-dom/client';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const { PreviewPrompt } = await import('../src/preview-prompt');

const TABLE =
  '<table><tbody><tr><td>a</td><td>b</td></tr><tr><td><p class="kds-indent">c</p></td><td>d</td></tr></tbody></table>';

let root: Root | undefined;

function mount(wrapped: boolean) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root?.render(React.createElement(PreviewPrompt as any, { prompt: TABLE })));
  const table = host.querySelector('table') as HTMLTableElement;
  if (wrapped) {
    const wrapper = document.createElement('div');
    wrapper.className = 'pie-table-scroll';
    table.replaceWith(wrapper);
    wrapper.appendChild(table);
  }
  return table;
}

afterEach(() => {
  act(() => root?.unmount());
  document.body.innerHTML = '';
  root = undefined;
});

describe('prompt table styles', () => {
  it.each([
    ['bare', false],
    ['wrapped by the player', true],
  ])('reach a %s table', (_label, wrapped) => {
    const table = mount(wrapped);

    expect(getComputedStyle(table).borderCollapse).toBe('collapse');
    expect(getComputedStyle(table.querySelector('p.kds-indent') as HTMLElement).textAlign).toBe('initial');
  });
});
