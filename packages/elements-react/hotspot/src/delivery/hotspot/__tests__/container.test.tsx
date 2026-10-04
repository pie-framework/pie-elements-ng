import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Konva draws on a canvas, which happy-dom lacks; the keyboard focusables render outside it. The
// layer stands in for Konva's with a bare canvas element.
vi.mock('react-konva', () => ({
  Stage: ({ children }: any) => <div>{children}</div>,
  Layer: React.forwardRef(({ children }: { children?: React.ReactNode }, ref) => {
    const canvas = React.useRef<HTMLCanvasElement>(null);
    React.useImperativeHandle(ref, () => ({ getNativeCanvasElement: () => canvas.current }));
    return (
      <div>
        <canvas ref={canvas} />
        {children}
      </div>
    );
  }),
}));
// The canvas shapes record the evaluate text their tooltip shows.
const tooltips = vi.hoisted(() => new Map<string, string | null>());
const recordTooltip = vi.hoisted(() => (props: { id: string; evaluateText: string | null }) => {
  tooltips.set(props.id, props.evaluateText);
  return null;
});
vi.mock('../rectangle.js', () => ({ default: recordTooltip }));
vi.mock('../polygon.js', () => ({ default: recordTooltip }));
vi.mock('../circle.js', () => ({ default: recordTooltip }));

const { Container } = await import('../container');

const theme = createTheme();

const shapes = {
  rectangles: [
    { id: '1', x: 0, y: 0, width: 10, height: 10, ariaLabel: 'Left wing' },
    { id: '3', x: 20, y: 0, width: 10, height: 10 },
  ],
  circles: [{ id: '2', x: 40, y: 0, radius: 5, ariaLabel: '  ' }],
};

const renderContainer = (extras?: any) =>
  render(
    <ThemeProvider theme={theme}>
      <Container
        dimensions={{ width: 100, height: 100 }}
        disabled={false}
        hotspotColor="rgba(0, 0, 0, 0.2)"
        imageUrl="plane.png"
        isEvaluateMode={false}
        onSelectChoice={vi.fn()}
        outlineColor="blue"
        session={{ answers: [] }}
        shapes={shapes}
        strokeWidth={2}
        {...extras}
      />
    </ThemeProvider>,
  );

describe('Container hotspot focusables', () => {
  it('keep an authored name and fall back to the position in tab order', () => {
    renderContainer();

    expect(screen.getAllByRole('button').map((button) => button.getAttribute('aria-label'))).toEqual([
      'Left wing',
      'Hotspot 2 of 3',
      'Hotspot 3 of 3',
    ]);
  });

  it('name unlabelled shapes in the item language', () => {
    renderContainer({ language: 'es_ES' });

    expect(screen.getByRole('button', { name: 'Zona activa 3 de 3' })).toBeInTheDocument();
  });

  it('toggle a shape with Enter or Space', () => {
    const onSelectChoice = vi.fn();
    renderContainer({ onSelectChoice });
    const shape = screen.getByRole('button', { name: 'Hotspot 3 of 3' });

    fireEvent.keyDown(shape, { key: 'Enter' });
    fireEvent.keyDown(shape, { key: ' ' });

    expect(onSelectChoice).toHaveBeenCalledTimes(2);
    expect(onSelectChoice).toHaveBeenCalledWith({ id: '3', selected: true, selector: 'Keyboard' });
  });
});

describe('Container evaluate correctness', () => {
  const evaluated = {
    rectangles: [
      { id: '1', x: 0, y: 0, width: 10, height: 10, correct: true },
      { id: '3', x: 20, y: 0, width: 10, height: 10, correct: false },
      { id: '4', x: 60, y: 0, width: 10, height: 10, correct: false },
    ],
    circles: [{ id: '2', x: 40, y: 0, radius: 5, correct: true }],
  };
  const renderEvaluated = (extras?: any) =>
    renderContainer({
      disabled: true,
      isEvaluateMode: true,
      session: { answers: [{ id: '1' }, { id: '3' }] },
      shapes: evaluated,
      ...extras,
    });

  it('describes each evaluated shape button by its correctness', () => {
    renderEvaluated();

    expect(screen.getByRole('button', { name: 'Hotspot 1 of 4' })).toHaveAccessibleDescription('Correctly selected');
    expect(screen.getByRole('button', { name: 'Hotspot 2 of 4' })).toHaveAccessibleDescription(
      'Should have been selected',
    );
    expect(screen.getByRole('button', { name: 'Hotspot 3 of 4' })).toHaveAccessibleDescription(
      'Should not have been selected',
    );
    expect(screen.getByRole('button', { name: 'Hotspot 4 of 4' })).not.toHaveAttribute('aria-describedby');
  });

  it('describes correctness in the item language', () => {
    renderEvaluated({ language: 'es_ES' });

    expect(screen.getByRole('button', { name: 'Zona activa 1 de 4' })).toHaveAccessibleDescription(
      'Seleccionada correctamente',
    );
    expect(screen.getByRole('button', { name: 'Zona activa 2 de 4' })).toHaveAccessibleDescription('Debía seleccionarse');
    expect(screen.getByRole('button', { name: 'Zona activa 3 de 4' })).toHaveAccessibleDescription(
      'No debía seleccionarse',
    );
  });

  it('shows the same text in the canvas tooltip', () => {
    tooltips.clear();
    renderEvaluated({ language: 'es_ES' });

    expect(Object.fromEntries(tooltips)).toEqual({
      '1': 'Seleccionada correctamente',
      '2': 'Debía seleccionarse',
      '3': 'No debía seleccionarse',
      '4': null,
    });
  });

  it('describes no correctness while gathering', () => {
    renderContainer({ session: { answers: [{ id: '1' }] }, shapes: evaluated });

    for (const button of screen.getAllByRole('button')) {
      expect(button).not.toHaveAttribute('aria-describedby');
    }
  });
});

describe('Container image', () => {
  it('describes the image by its number of hotspots', () => {
    renderContainer();

    expect(screen.getByRole('img', { name: 'Image with 3 hotspots' })).toHaveAttribute('src', 'plane.png');
  });

  it('describes the image in the item language', () => {
    renderContainer({ language: 'es_ES', shapes: { rectangles: [shapes.rectangles[0]] } });

    expect(screen.getByRole('img', { name: 'Imagen con 1 zona activa' })).toBeInTheDocument();
  });

  it('hides the canvas that redraws the shapes', () => {
    const { container } = renderContainer();

    expect(container.querySelector('canvas')).toHaveAttribute('aria-hidden', 'true');
  });
});
