import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

// MathJax loads off a CDN and has no bearing on the toolbar.
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const { EditableHtml } = await import('../src/components/EditableHtml');
const { TOOLBAR_BACKGROUND } = await import('../src/constants');

describe('EditableHtml toolbar fill', () => {
  it("takes the host's override first, then mixes into the theme background", () => {
    expect(TOOLBAR_BACKGROUND).toMatch(
      /^var\(--editable-html-toolbar-bg, color-mix\(in srgb, .+, var\(--pie-background, #ffffff\)\)\)$/,
    );
  });

  // happy-dom does not resolve color-mix, so read the rule emotion emits.
  it('fills the formatting toolbar', async () => {
    render(<EditableHtml markup="" onChange={vi.fn()} activePlugins={['bold']} />);
    await waitFor(() => screen.getByRole('textbox'));

    const css = [...document.querySelectorAll('style')].map((s) => s.textContent).join('\n');
    const rule = css.split('}').find((r) => r.includes(' .toolbar{'));
    expect(rule).toContain(`background:${TOOLBAR_BACKGROUND};`);
  });
});
