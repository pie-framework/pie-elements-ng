import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

// MathJax loads off a CDN and has no bearing on the response names.
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const { default: ConstructedResponse } = await import('../constructed-response');

// Spread, as explicit-constructed-response passes them: withMask declares only the props it reads.
const renderResponses = (markup: string, language?: string, contentLanguage?: string) => {
  const props = { markup, value: {}, onChange: vi.fn(), language, contentLanguage };
  return render(<ConstructedResponse {...props} />);
};

const names = () =>
  waitFor(() => {
    const boxes = screen.getAllByRole('textbox');
    expect(boxes).toHaveLength(3);
    return boxes.map((box) => box.getAttribute('aria-label'));
  });

describe('ConstructedResponse', () => {
  it('names each response by its position', async () => {
    renderResponses('<p>Water {{0}} at 0 °C, {{1}} at 100 °C and {{2}} below 0 °C.</p>');

    expect(await names()).toEqual(['Response 1 of 3', 'Response 2 of 3', 'Response 3 of 3']);
  });

  it('numbers responses in reading order', async () => {
    renderResponses('<p>{{2}}, {{0}} and {{1}}</p>');

    expect(await names()).toEqual(['Response 1 of 3', 'Response 2 of 3', 'Response 3 of 3']);
  });

  it('names each response in the interface language', async () => {
    renderResponses('<p>{{0}}, {{1}} y {{2}}</p>', 'es_ES');

    await waitFor(async () =>
      expect(await names()).toEqual(['Respuesta 1 de 3', 'Respuesta 2 de 3', 'Respuesta 3 de 3']),
    );
  });

  it('marks each response in the content language', async () => {
    renderResponses('<p>{{0}}, {{1}} et {{2}}</p>', 'es_ES', 'fr');

    expect(await names()).toEqual(['Respuesta 1 de 3', 'Respuesta 2 de 3', 'Respuesta 3 de 3']);
    expect(screen.getAllByRole('textbox').map((box) => box.getAttribute('lang'))).toEqual(Array(3).fill('fr'));
  });

  it('names each response toolbar in the content language without an interface locale', async () => {
    renderResponses('<p>{{0}}, {{1}} y {{2}}</p>', undefined, 'es_ES');
    await names();

    await waitFor(() => {
      const toolbars = [...document.querySelectorAll('[role="toolbar"]')];
      expect(toolbars.map((bar) => bar.getAttribute('aria-label'))).toEqual(Array(3).fill('Herramientas de edición'));
    });
  });
});
