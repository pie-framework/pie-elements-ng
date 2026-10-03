import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { DrawableMain } from '../drawable-main';

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
  drawableDimensions: { height: 100, width: 100 },
  imageDimensions: { height: 100, width: 100 },
  fillColor: 'transparent',
  outlineColor: 'black',
  paintColor: 'red',
  onSessionChange: vi.fn(),
  imageUrl: '',
  TextEntry: { all: [], render: () => null, renderTextareas: () => null },
  toolActive: { type: 'Select' },
  session: {},
  backgroundImageEnabled: true,
  scale: 1,
};

describe('drawing canvas name', () => {
  it('names the canvas on mount and again when the item changes', () => {
    const { container, rerender } = render(<DrawableMain {...props} />);
    const canvas = container.querySelector('canvas');

    expect(canvas).toHaveAttribute('role', 'img');
    expect(canvas).toHaveAccessibleName(
      'Drawing area. Tools: Select, Free draw, Line, Rectangle, Circle, Text entry, Eraser.',
    );

    const viewProps = { ...props, disabled: true, imageUrl: 'https://example.com/map.png' };
    rerender(<DrawableMain {...viewProps} />);

    expect(canvas).toHaveAccessibleName('Drawing area over a background image.');
  });

  it('does not mention an image the item hides', () => {
    const hiddenImageProps = { ...props, imageUrl: 'https://example.com/map.png', backgroundImageEnabled: false };
    const { container } = render(<DrawableMain {...hiddenImageProps} />);

    expect(container.querySelector('canvas')).toHaveAccessibleName(
      'Drawing area. Tools: Select, Free draw, Line, Rectangle, Circle, Text entry, Eraser.',
    );
  });
});
