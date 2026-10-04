import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

// MathJax loads off a CDN and has no bearing on the text box's name.
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const { EditableHtml } = await import('../src/components/EditableHtml');

const editor = (props: Record<string, unknown>) => (
  <EditableHtml markup="" onChange={vi.fn()} activePlugins={[]} {...props} />
);

const textbox = () => waitFor(() => screen.getByRole('textbox'));

describe('EditableHtml text box name', () => {
  it('takes the name a caller gives it', async () => {
    render(editor({ ariaLabel: 'Response 1 of 3' }));

    expect(await textbox()).toHaveAttribute('aria-label', 'Response 1 of 3');
  });

  it('can be labelled by another element', async () => {
    render(
      <>
        <p id="prompt">Describe the water cycle.</p>
        {editor({ ariaLabelledBy: 'prompt' })}
      </>
    );

    expect(await textbox()).toHaveAttribute('aria-labelledby', 'prompt');
  });

  it('has no name attributes when none is given', async () => {
    render(editor({}));

    const box = await textbox();
    expect(box).not.toHaveAttribute('aria-label');
    expect(box).not.toHaveAttribute('aria-labelledby');
  });

  it('follows a name change, and drops a name that is taken away', async () => {
    const { rerender } = render(editor({ ariaLabel: 'Response 1 of 2' }));
    const box = await textbox();

    rerender(editor({ ariaLabel: 'Respuesta 1 de 2' }));
    await waitFor(() => expect(box).toHaveAttribute('aria-label', 'Respuesta 1 de 2'));

    rerender(editor({ ariaLabelledBy: 'prompt' }));
    await waitFor(() => expect(box).toHaveAttribute('aria-labelledby', 'prompt'));
    expect(box).not.toHaveAttribute('aria-label');
    expect(box).toHaveAttribute('data-pie-editor', 'true');
  });
});
