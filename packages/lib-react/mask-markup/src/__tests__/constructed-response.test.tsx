import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

// MathJax loads off a CDN and has no bearing on the response names.
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const { default: ConstructedResponse } = await import('../constructed-response');

// Spread, as explicit-constructed-response passes them: withMask declares only the props it reads.
const renderResponses = (markup: string, language?: string) => {
  const props = { markup, value: {}, onChange: vi.fn(), language };
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

  it('names each response in the item language', async () => {
    renderResponses('<p>{{0}}, {{1}} y {{2}}</p>', 'es_ES');

    expect(await names()).toEqual(['Respuesta 1 de 3', 'Respuesta 2 de 3', 'Respuesta 3 de 3']);
  });
});
