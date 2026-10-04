import React from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Likert from '../likert';
import LikertElement from '../index';

// The element renders math through MathJax, which happy-dom cannot load.
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

// Two element versions on a page each bundle their own lodash, whose uniqueId counters both
// start at 1; a constant reproduces that within this one module graph.
vi.mock('@pie-element/shared-lodash', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@pie-element/shared-lodash')>()),
  uniqueId: (prefix = '') => `${prefix}1`,
}));

const theme = createTheme();

const choices = [
  { label: '<strong>Disagree</strong>', value: -1 },
  { label: 'Neutral', value: 0 },
  { label: 'Agree', value: 1 },
];

const likert = (likertOrientation = 'horizontal', value = 0) => (
  <ThemeProvider theme={theme}>
    <Likert
      choices={choices}
      disabled={false}
      likertOrientation={likertOrientation}
      onSessionChange={vi.fn()}
      session={{ value }}
    />
  </ThemeProvider>
);

const renderLikert = (likertOrientation = 'horizontal') => render(likert(likertOrientation));

const pageIds = () => [...document.querySelectorAll('[id]')].map((el) => el.id);

describe('Likert choice names', () => {
  it.each(['horizontal', 'vertical'])('names each radio from its choice label (%s)', (orientation) => {
    renderLikert(orientation);

    expect(screen.getAllByRole('radio')).toHaveLength(3);
    expect(screen.getByRole('radio', { name: 'Disagree' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'Neutral' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Agree' })).not.toBeChecked();
  });
});

describe('Likert ids', () => {
  it('stay unique when two items share a page', () => {
    renderLikert();
    renderLikert();

    expect(screen.getAllByRole('radio', { name: 'Agree' })).toHaveLength(2);
    expect(new Set(pageIds()).size).toBe(pageIds().length);
  });

  it('stay the same across re-renders', () => {
    const { rerender } = render(likert('horizontal', 0));
    const before = pageIds();

    rerender(likert('horizontal', 1));

    expect(screen.getByRole('radio', { name: 'Agree' })).toBeChecked();
    expect(pageIds()).toEqual(before);
  });
});

describe('Likert teacher instructions', () => {
  it.each([
    ['en_US', 'Show Teacher Instructions'],
    ['es_ES', 'Mostrar instrucciones para el maestro'],
  ])('label their toggle in the %s item language', (language, label) => {
    render(
      <ThemeProvider theme={theme}>
        <Likert
          choices={choices}
          disabled={false}
          language={language}
          likertOrientation="horizontal"
          onSessionChange={vi.fn()}
          session={{}}
          teacherInstructions="Read aloud."
        />
      </ThemeProvider>,
    );

    expect(screen.getByRole('button', { name: label })).toHaveAttribute('aria-expanded', 'false');
  });
});

customElements.define('likert-radio-group-test', LikertElement);

const PROMPT = 'How likely are you to report a problem?';

type Session = { value?: number };

const mountElement = async (session: Session = {}) => {
  const el = document.createElement('likert-radio-group-test') as LikertElement;
  const changes = vi.fn();
  el.addEventListener('session-changed', changes);
  await act(async () => {
    document.body.append(el);
    el.model = { choices, prompt: PROMPT, disabled: false, likertOrientation: 'horizontal' };
    el.session = session;
  });
  return { el, changes, group: within(el).getByRole('radiogroup') };
};

const appendButton = () => {
  const button = document.createElement('button');
  button.textContent = 'After';
  document.body.append(button);
  return button;
};

afterEach(async () => {
  await act(async () => document.body.replaceChildren());
});

describe('Likert radio group', () => {
  it('is named by the prompt', async () => {
    const { el } = await mountElement();

    const group = within(el).getByRole('radiogroup', { name: PROMPT });
    expect(within(group).getAllByRole('radio')).toHaveLength(3);
  });

  it.each([
    ['no choice', {}, 'Disagree'],
    ['a choice', { value: 1 }, 'Agree'],
  ])('is one tab stop with %s selected', async (_, session, focused) => {
    const user = userEvent.setup();
    const { group } = await mountElement(session);
    const next = appendButton();

    await user.tab();
    expect(within(group).getByRole('radio', { name: focused })).toHaveFocus();

    await user.tab();
    expect(next).toHaveFocus();
  });

  it('records the response on each arrow press as a click does', async () => {
    const user = userEvent.setup();
    const { el, changes, group } = await mountElement();

    await user.click(within(group).getByRole('radio', { name: 'Disagree' }));
    expect(el.session.value).toBe(-1);

    await user.keyboard('{ArrowRight}');
    expect(within(group).getByRole('radio', { name: 'Neutral' })).toBeChecked();
    expect(el.session.value).toBe(0);

    await user.keyboard('{ArrowRight}');
    expect(within(group).getByRole('radio', { name: 'Agree' })).toHaveFocus();
    expect(el.session.value).toBe(1);

    await user.keyboard('{ArrowLeft}');
    expect(el.session.value).toBe(0);
    expect(changes).toHaveBeenCalledTimes(4);
  });

  it('leaves a second item unchanged', async () => {
    const user = userEvent.setup();
    const first = await mountElement({ value: -1 });
    const second = await mountElement({ value: -1 });

    const names = (group: HTMLElement) =>
      new Set(within(group).getAllByRole('radio').map((radio) => radio.getAttribute('name')));
    expect(names(first.group).size).toBe(1);
    expect([...names(first.group)]).not.toEqual([...names(second.group)]);

    await user.click(within(first.group).getByRole('radio', { name: 'Neutral' }));
    await user.keyboard('{ArrowRight}');

    expect(first.el.session.value).toBe(1);
    expect(second.el.session.value).toBe(-1);
    expect(within(second.group).getByRole('radio', { name: 'Disagree' })).toBeChecked();
    expect(second.changes).not.toHaveBeenCalled();
  });
});
