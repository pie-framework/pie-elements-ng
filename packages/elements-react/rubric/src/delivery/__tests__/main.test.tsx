import React from 'react';
import { beforeAll, describe, it, expect } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { loadLocale } from '@pie-element/shared-i18n';
import RubricComponent from '../main';

// The custom element holds its first render until the chrome locale is resident; so does this.
beforeAll(() => loadLocale('es_ES'));

const value = {
  excludeZero: false,
  points: ['Nothing correct', 'Partly correct', 'Fully correct'],
  sampleAnswers: [] as string[],
};

// main.tsx is untyped, so its class declares no props.
const Rubric = RubricComponent as unknown as React.ComponentType<{
  model: object;
  value: typeof value;
  language?: string;
}>;

describe('Rubric toggle', () => {
  it('is at least 24px tall', () => {
    render(<Rubric model={{}} value={value} />);

    expect(screen.getByRole('button', { name: 'Show Rubric' })).toHaveStyle({ minHeight: '24px' });
  });

  it('is a native button that discloses the rubric', () => {
    render(<Rubric model={{}} value={value} />);
    const toggle = screen.getByRole('button', { name: 'Show Rubric' });
    const content = document.getElementById(toggle.getAttribute('aria-controls') ?? '');

    expect(toggle.tagName).toBe('BUTTON');
    expect(toggle).toHaveAttribute('type', 'button');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(content).toHaveTextContent('Fully correct');

    fireEvent.click(toggle);

    expect(screen.getByRole('button', { name: 'Hide Rubric' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('leaves the rubric in the heading list', () => {
    render(<Rubric model={{}} value={value} />);

    expect(screen.getByRole('heading', { name: 'Rubric' })).toBeInTheDocument();
  });

  it.each([
    ['en_US', 'Rubric', 'Show Rubric', 'Hide Rubric'],
    ['es_ES', 'Rúbrica', 'Mostrar rúbrica', 'Ocultar rúbrica'],
  ])('names the heading and toggle in the %s chrome language', (language, heading, show, hide) => {
    render(<Rubric model={{}} value={value} language={language} />);

    expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: show }));
    expect(screen.getByRole('button', { name: hide })).toHaveAttribute('aria-expanded', 'true');
  });
});

describe('Rubric points', () => {
  it('are a list, with no navigation landmark', () => {
    render(<Rubric model={{}} value={value} />);
    fireEvent.click(screen.getByRole('button', { name: 'Show Rubric' }));

    expect(screen.queryByRole('navigation')).toBeNull();
    expect(within(screen.getByRole('list')).getAllByRole('listitem')).toHaveLength(3);
  });

  it.each([
    ['en_US', ['2 PTS', '1 PT', '0 PTS'], 'Sample Answer'],
    ['es_ES', ['2 PTOS', '1 PTO', '0 PTOS'], 'Respuesta de ejemplo'],
  ])('are headed by their point value in the %s chrome language', (language, headings, sample) => {
    const { container } = render(
      <Rubric model={{}} value={{ ...value, sampleAnswers: ['', 'Some'] }} language={language} />,
    );

    const titles = [...container.querySelectorAll('h3, h4')].map((title) => title.textContent);
    expect(titles).toEqual([headings[0], headings[1], sample, headings[2]]);
  });
});

describe('Rubric ids', () => {
  const pageIds = () => [...document.querySelectorAll('[id]')].map((el) => el.id);

  it('stay unique when two rubrics share a page', () => {
    render(<Rubric model={{}} value={value} />);
    render(<Rubric model={{}} value={value} />);

    expect(screen.getAllByRole('button', { name: 'Show Rubric' })).toHaveLength(2);
    expect(new Set(pageIds()).size).toBe(pageIds().length);
  });

  it('stay the same across re-renders', () => {
    const { rerender } = render(<Rubric model={{}} value={value} />);
    const before = pageIds();

    rerender(<Rubric model={{}} value={{ ...value, sampleAnswers: ['None'] }} />);

    expect(pageIds()).toEqual(before);
  });
});

// DNAATD-5648: the editor pairs samples with scores from the highest score down, so a
// sampleAnswers list longer than points has its extra, empty slots at the low-score end.
describe('Rubric sample answers', () => {
  const rows = (sampleAnswers: (string | null)[]) => {
    const { container } = render(<Rubric model={{}} value={{ ...value, sampleAnswers: sampleAnswers as string[] }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Show Rubric' }));
    return [...container.querySelectorAll('li')].map((li) => li.textContent);
  };

  it('sit under the score the editor shows when the list has a leading empty slot', () => {
    expect(rows([null, 'Score 0 sample', 'Score 1 sample', 'Score 2 sample'])).toEqual([
      '2 PTSFully correct',
      'Sample AnswerScore 2 sample',
      '1 PTPartly correct',
      'Sample AnswerScore 1 sample',
      '0 PTSNothing correct',
      'Sample AnswerScore 0 sample',
    ]);
  });

  it('show a top-score sample stored in a four-slot list for three scores', () => {
    expect(rows([null, null, null, 'Top sample'])).toEqual([
      '2 PTSFully correct',
      'Sample AnswerTop sample',
      '1 PTPartly correct',
      '0 PTSNothing correct',
    ]);
  });

  it('keep a list that matches the scores as it is', () => {
    expect(rows(['Zero', null, 'Two'])).toEqual([
      '2 PTSFully correct',
      'Sample AnswerTwo',
      '1 PTPartly correct',
      '0 PTSNothing correct',
      'Sample AnswerZero',
    ]);
  });

  it('start a shorter list at the lowest score', () => {
    expect(rows(['Zero'])).toEqual([
      '2 PTSFully correct',
      '1 PTPartly correct',
      '0 PTSNothing correct',
      'Sample AnswerZero',
    ]);
  });
});
