/**
 * The author view is a placeholder, and runtime-support reports ESM authoring
 * unsupported. The exported element must still register and accept a model.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync } from 'svelte';
import { assertAuthorElementProperties } from '@pie-element/shared-test-utils';
import McPopulatedBlankAuthor from '../src/author/index.js';

const TAG = 'mc-populated-blank-config--version-0-0-0-author-element-test';
if (!customElements.get(TAG)) {
  customElements.define(TAG, McPopulatedBlankAuthor as CustomElementConstructor);
}

let root: HTMLElement | null = null;

afterEach(() => {
  root?.remove();
  root = null;
});

describe('mc-populated-blank author element', () => {
  it('renders the placeholder for a model it is given', async () => {
    root = document.createElement('div');
    document.body.appendChild(root);
    const element = document.createElement(TAG) as any;
    root.appendChild(element);
    const model = { id: '1', element: 'mc-populated-blank--version-0-0-0', prompt: '<p>P</p>' };
    element.model = model;
    await new Promise((resolve) => setTimeout(resolve, 0));
    flushSync();

    expect(element.model).toEqual(model);
    expect(element.querySelector('[role="status"]')?.textContent).toContain('placeholder');
  });

  it('declares the properties a player sets', () => {
    expect(() => assertAuthorElementProperties(TAG)).not.toThrow();
  });
});
