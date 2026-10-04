import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

// MathJax loads off a CDN and has no bearing on the response's name.
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const { Main } = await import('../main');

const renderMain = (model: Record<string, unknown>) =>
  render(
    <Main
      model={{ disabled: false, ...model }}
      session={{}}
      onValueChange={vi.fn()}
      onAnnotationsChange={vi.fn()}
      onCommentChange={vi.fn()}
    />
  );

function paste(target: Element, flavours: Record<string, string>) {
  const clipboardData = {
    types: Object.keys(flavours),
    items: Object.keys(flavours).map((type) => ({ kind: 'string', type })),
    files: [],
    getData: (type: string) => flavours[type] ?? '',
  };
  const event = new Event('paste', { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'clipboardData', { value: clipboardData });
  target.dispatchEvent(event);
}

const FORMATTED = {
  'text/html': '<p><b>Bold</b> and <i>italic</i></p><ul><li>Listed</li></ul>',
  'text/plain': 'Bold and italic\nListed',
};

describe('Main', () => {
  it('keeps the formatting the response toolbar offers when a student pastes', async () => {
    renderMain({ language: 'en_US' });
    const response = await waitFor(() => screen.getByRole('textbox'));

    paste(response, FORMATTED);

    expect(response.querySelector('strong')).toHaveTextContent('Bold');
    expect(response.querySelector('em')).toHaveTextContent('italic');
    // The response toolbar offers no lists.
    expect(response.querySelector('ul')).toBeNull();
    expect(response).toHaveTextContent('Listed');
  });

  it('pastes plain text when the author turned paste formatting off', async () => {
    renderMain({ language: 'en_US', pasteFormattingDisabled: true });
    const response = await waitFor(() => screen.getByRole('textbox'));

    paste(response, FORMATTED);

    expect(response).toHaveTextContent('Bold and italic');
    expect(response.querySelector('strong, em')).toBeNull();
  });

  it('names the response by its prompt', async () => {
    renderMain({ prompt: '<p>Describe the water cycle.</p>', language: 'en_US' });

    expect(await waitFor(() => screen.getByRole('textbox'))).toHaveAccessibleName(
      'Describe the water cycle.'
    );
  });

  it('gives the response a generic name without a prompt', async () => {
    renderMain({ language: 'en_US' });

    expect(await waitFor(() => screen.getByRole('textbox'))).toHaveAccessibleName('Your response');
  });

  it('gives the generic name in the item language', async () => {
    renderMain({ language: 'es_ES' });

    expect(await waitFor(() => screen.getByRole('textbox'))).toHaveAccessibleName('Tu respuesta');
  });

  it('names the annotation comment editor in the item language', async () => {
    renderMain({ annotatorMode: true, disabledAnnotator: false, language: 'es_ES' });

    expect(await waitFor(() => screen.getByRole('textbox'))).toHaveAccessibleName('Comentario');
    expect(screen.getByText('Comentario', { selector: 'label' })).toBeInTheDocument();
  });

  it('names the editor toolbar in the item language', async () => {
    renderMain({ language: 'es_ES' });
    await waitFor(() => screen.getByRole('textbox'));

    expect(document.querySelector('[role="toolbar"]')).toHaveAttribute('aria-label', 'Herramientas de edición');
  });
});
