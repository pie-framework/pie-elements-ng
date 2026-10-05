import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// MathJax loads off a CDN, and the blanks have no bearing on the item's heading and toggles.
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));
vi.mock('@pie-lib/mask-markup', () => ({ ConstructedResponse: () => null }));

const { default: MainComponent } = await import('../main');

// main.tsx is untyped, so its class declares no props.
const Main = MainComponent as unknown as React.ComponentType<Record<string, unknown>>;

describe('explicit-constructed-response language', () => {
  it.each([
    ['en_US', 'Fill in the Blank Question', 'Show Teacher Instructions', 'Show Rationale'],
    [
      'es_ES',
      'Pregunta para completar espacios en blanco',
      'Mostrar instrucciones para el maestro',
      'Mostrar justificación',
    ],
  ])('names the heading and toggles in the %s item language', (language, heading, instructions, rationale) => {
    render(
      <Main
        model={{}}
        mode="gather"
        language={language}
        markup=""
        choices={{}}
        onChange={vi.fn()}
        teacherInstructions="<p>Read aloud.</p>"
        rationale="<p>Because.</p>"
      />,
    );

    expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: instructions })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: rationale })).toBeInTheDocument();
  });
});
