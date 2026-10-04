import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// MathJax loads off a CDN, and the response areas have no bearing on the item's heading and toggles.
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));
vi.mock('@pie-lib/mask-markup', () => ({ Customizable: () => null }));
vi.mock('@pie-lib/math-input', () => ({
  mq: { Static: () => null },
  HorizontalKeypad: () => null,
  updateSpans: () => {},
  registerEmbed: () => {},
  applyStaticMath: () => {},
}));

const { Main } = await import('../main');

describe('math-templated language', () => {
  it.each([
    ['en_US', 'Math Equation Response Question', 'Show Teacher Instructions', 'Show Rationale'],
    [
      'es_ES',
      'Pregunta de respuesta con ecuación matemática',
      'Mostrar instrucciones para el maestro',
      'Mostrar justificación',
    ],
  ])('names the heading and toggles in the %s item language', (language, heading, instructions, rationale) => {
    // main.tsx is untyped, so its class declares no props.
    const MainComponent = Main as unknown as React.ComponentType<Record<string, unknown>>;
    render(
      <MainComponent
        model={{
          env: { mode: 'gather' },
          language,
          markup: '',
          teacherInstructions: '<p>Read aloud.</p>',
          rationale: '<p>Because.</p>',
        }}
        session={{}}
        onSessionChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: instructions })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: rationale })).toBeInTheDocument();
  });
});
