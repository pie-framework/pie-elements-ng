import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const { MultipleChoice } = await import('../multiple-choice');

// multiple-choice.tsx is untyped, so its class declares no props.
const Item = MultipleChoice as unknown as React.ComponentType<Record<string, unknown>>;

describe('multiple-choice language', () => {
  it.each([
    ['radio', 'en_US', 'Multiple Choice Question', 'Show Teacher Instructions'],
    ['checkbox', 'en_US', 'Multiple Select Question', 'Show Teacher Instructions'],
    ['radio', 'es_ES', 'Pregunta de opción múltiple', 'Mostrar instrucciones para el maestro'],
    ['checkbox', 'es_ES', 'Pregunta de selección múltiple', 'Mostrar instrucciones para el maestro'],
  ])('names a %s heading and teacher instructions in the %s item language', (choiceMode, language, heading, toggle) => {
    render(
      <Item
        mode="gather"
        choiceMode={choiceMode}
        language={language}
        choices={[]}
        session={{}}
        prompt="<p>Pick one.</p>"
        teacherInstructions="<p>Read aloud.</p>"
        onChoiceChanged={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: toggle })).toBeInTheDocument();
  });
});
