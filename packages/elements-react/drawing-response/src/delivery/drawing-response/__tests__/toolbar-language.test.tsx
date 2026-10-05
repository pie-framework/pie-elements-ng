import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Container } from '../container';
import DrawableImage from '../drawable-image';

// Konva needs node-canvas outside a browser; the stand-in stage renders the one canvas a single-layer stage creates.
vi.mock('react-konva', async () => {
  const { createElement, forwardRef } = await import('react');
  const shape = forwardRef(() => null);
  return {
    Stage: forwardRef(() => createElement('div', null, createElement('canvas'))),
    Layer: shape,
    Arrow: shape,
    Circle: shape,
    Line: shape,
    Rect: shape,
    Text: shape,
    Transformer: shape,
  };
});

const props = {
  disabled: false,
  session: {},
  onSessionChange: vi.fn(),
  imageDimensions: { height: 100, width: 100 },
  imageUrl: '',
  backgroundImageEnabled: false,
};

const toolTitles = () =>
  screen
    .getAllByRole('button')
    .map((button) => button.getAttribute('title'))
    .filter(Boolean);

describe('drawing toolbar', () => {
  it.each([
    ['en_US', ['Select', 'Free Draw', 'Line', 'Rectangle', 'Circle', 'Text Entry', 'Eraser']],
    [
      'es_ES',
      ['Seleccionar', 'Dibujo libre', 'Línea', 'Rectángulo', 'Círculo', 'Entrada de texto', 'Borrador'],
    ],
  ])('names the tools in the %s item language', (language, titles) => {
    render(<Container {...props} language={language} />);

    expect(toolTitles()).toEqual(titles);
  });
});

describe('drawing background image', () => {
  it('is decorative: the drawing area names it', () => {
    const { container } = render(
      <DrawableImage url="https://example.com/map.png" dimensions={{ height: 100, width: 100 }} />,
    );

    expect(container.querySelector('img')).toHaveAttribute('alt', '');
  });
});
