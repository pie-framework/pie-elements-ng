import React from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { loadLocale } from '@pie-element/shared-i18n';

// MathJax loads off a CDN, and the blanks have no bearing on the item's heading and toggles.
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));
vi.mock('@pie-lib/mask-markup', () => ({ ConstructedResponse: () => null }));

const { default: MainComponent } = await import('../main');

// main.tsx is untyped, so its class declares no props.
const Main = MainComponent as unknown as React.ComponentType<Record<string, unknown>>;

// The custom element holds its first render until the chrome locale is resident; so does this.
beforeAll(() => loadLocale('es_ES'));

describe('explicit-constructed-response language', () => {
  it.each([
    ['en_US', 'Fill in the Blank Question', 'Show Teacher Instructions', 'Show Rationale'],
    [
      'es_ES',
      'Pregunta para completar espacios en blanco',
      'Mostrar instrucciones para el maestro',
      'Mostrar justificación',
    ],
  ])('names the heading and toggles in the %s chrome language', (language, heading, instructions, rationale) => {
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

  const evaluate = { model: {}, mode: 'evaluate', markup: '', choices: {}, onChange: vi.fn(), alwaysShowCorrect: true, showNote: true };

  it('renders the alternates default in the chrome language when the author wrote no note', () => {
    render(<Main {...evaluate} language="es_ES" />);

    expect(document.body.textContent).toContain('Nota: La respuesta que se muestra arriba');
  });

  it('renders an authored note as written', () => {
    render(<Main {...evaluate} language="es_ES" note="<p>Any spelling counts.</p>" />);

    expect(document.body.textContent).toContain('Any spelling counts.');
    expect(document.body.textContent).not.toContain('Nota:');
  });
});
