import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// MathJax loads off a CDN, and the dropdowns have no bearing on the item's heading and toggles.
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));
vi.mock('@pie-lib/mask-markup', () => ({ InlineDropdown: () => null }));

const { default: InlineDropdownComponent } = await import('../inline-dropdown');

// inline-dropdown.tsx is untyped, so its class declares no props.
const InlineDropdown = InlineDropdownComponent as unknown as React.ComponentType<Record<string, unknown>>;

const choices = { 0: [{ value: '0', label: 'Jupiter', correct: true, rationale: '<p>Largest.</p>' }] };

describe('inline-dropdown language', () => {
  it.each([
    [
      'en_US',
      'Inline Dropdown Question',
      ['Show Teacher Instructions', 'Show Rationale for choices', 'Show Rationale'],
    ],
    [
      'es_ES',
      'Pregunta con menú desplegable',
      [
        'Mostrar instrucciones para el maestro',
        'Mostrar justificación de las opciones',
        'Mostrar justificación',
      ],
    ],
  ])('names the heading and toggles in the %s item language', (language, heading, toggles) => {
    render(
      <InlineDropdown
        model={{}}
        mode="gather"
        language={language}
        markup=""
        choices={choices}
        onChange={vi.fn()}
        teacherInstructions="<p>Read aloud.</p>"
        rationale="<p>Because.</p>"
      />,
    );

    expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
    expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual(toggles);
  });
});
