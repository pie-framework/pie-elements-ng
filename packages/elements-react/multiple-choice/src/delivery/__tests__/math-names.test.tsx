import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const { MultipleChoice } = await import('../multiple-choice');
const { ACCESSIBILITY_CONTEXT, SPOKEN_MATH_NAMES } = await import('../accessibility-context');
const { default: MultipleChoiceElement } = await import('../index');

// multiple-choice.tsx is untyped, so its class declares no props.
const Item = MultipleChoice as unknown as React.ComponentType<Record<string, unknown>>;

const PROMPT = '<p>Solve \\(x^2 = 4\\).</p>';
const CHOICES = [
  { value: 'a', label: '<span data-latex="">\\(x = \\pm 2\\)</span>' },
  { value: 'b', label: '25 and 200' },
];

const item = (props: Record<string, unknown> = {}) => (
  <Item
    mode="gather"
    choiceMode="radio"
    keyMode="letters"
    prompt={PROMPT}
    choices={CHOICES}
    session={{ value: [] }}
    onChoiceChanged={vi.fn()}
    {...props}
  />
);

/** A control's name when `aria-labelledby` names it, as the browser joins the referenced text. */
const labelledByName = (element: Element) =>
  (element.getAttribute('aria-labelledby') || '')
    .split(/\s+/)
    .filter(Boolean)
    .map((id) => document.getElementById(id)?.textContent?.trim() ?? '')
    .join(' ');

afterEach(() => {
  document.body.innerHTML = '';
});

describe('multiple-choice math in names (PIE-1244)', () => {
  it('names the group "Answer choices" and renders the prompt before it', () => {
    const { container } = render(item());

    const fieldset = container.querySelector('fieldset') as HTMLFieldSetElement;
    const legend = fieldset.querySelector(':scope > legend') as HTMLLegendElement;
    expect(legend.textContent).toBe('Answer choices');
    expect(legend.classList.contains('pie-sr-only')).toBe(true);
    expect(screen.getByRole('radiogroup', { name: 'Answer choices' })).toBe(fieldset);

    const prompt = container.querySelector('.prompt') as HTMLElement;
    expect(fieldset.contains(prompt)).toBe(false);
    expect(prompt.compareDocumentPosition(fieldset) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(prompt.classList.contains('legend')).toBe(true);
  });

  it('names the group in the item language', () => {
    render(item({ language: 'es_ES' }));
    expect(screen.getByRole('radiogroup', { name: 'Opciones de respuesta' })).toBeInTheDocument();
  });

  it('names a math choice by its key and a note, and a text choice by its text', () => {
    render(item());
    const [math, text] = screen.getAllByRole('radio');

    expect(labelledByName(math)).toBe('A. Pick the answer below');
    expect(text.hasAttribute('aria-labelledby')).toBe(false);
    expect(screen.getByRole('radio', { name: 'B 25 and 200' })).toBe(text);
  });

  it('keeps the note in the item language and out of read-aloud', () => {
    render(item({ language: 'es_ES' }));
    const [math] = screen.getAllByRole('radio');
    const note = document.getElementById((math.getAttribute('aria-labelledby') || '').split(' ')[1]);

    expect(note?.textContent).toBe('Seleccione la respuesta de abajo');
    expect(note?.classList.contains('pie-sr-only')).toBe(true);
  });

  it('names a math choice from its label under spoken math names', () => {
    render(item({ spokenMathNames: true }));
    const [math] = screen.getAllByRole('radio');

    expect(math.hasAttribute('aria-labelledby')).toBe(false);
    expect(document.body.textContent).not.toContain('Pick the answer below');
  });

  it('names a math choice from its label when it has no key', () => {
    render(item({ keyMode: 'none' }));
    const [math] = screen.getAllByRole('radio');

    expect(math.hasAttribute('aria-labelledby')).toBe(false);
  });

  it('names checkbox choices the same way', () => {
    render(item({ choiceMode: 'checkbox' }));
    const [math] = screen.getAllByRole('checkbox');

    expect(screen.getByRole('group', { name: 'Answer choices' })).toBeInTheDocument();
    expect(labelledByName(math)).toBe('A. Pick the answer below');
  });
});

describe('multiple-choice spoken math names opt-in', () => {
  type Host = HTMLElement & { model: object; session: object };
  customElements.define('test-mc-math-names', MultipleChoiceElement as unknown as CustomElementConstructor);

  /** A Player that answers the accessibility context and can change its answer later. */
  function provide(supports: string[]) {
    const subscribers: Array<(value: unknown, unsubscribe: () => void) => void> = [];
    const provider = document.createElement('div');
    provider.addEventListener('context-request', (event) => {
      const request = event as Event & { context: symbol; callback: (value: unknown, unsubscribe: () => void) => void };
      if (request.context !== ACCESSIBILITY_CONTEXT) return;
      event.stopPropagation();
      subscribers.push(request.callback);
      request.callback({ supports }, () => {});
    });
    document.body.appendChild(provider);
    return {
      provider,
      answer: (next: string[]) => {
        for (const callback of subscribers) callback({ supports: next }, () => {});
      },
    };
  }

  const mount = async (parent: Element) => {
    const el = document.createElement('test-mc-math-names') as Host;
    parent.appendChild(el);
    el.model = { mode: 'gather', choiceMode: 'radio', keyMode: 'letters', prompt: PROMPT, choices: CHOICES };
    el.session = { value: [] };
    await vi.waitFor(() => expect(el.querySelector('input')).not.toBeNull());
    return el;
  };

  it('names math choices by key and note when no Player answers', async () => {
    const el = await mount(document.body);
    await vi.waitFor(() => expect(el.querySelector('input')?.hasAttribute('aria-labelledby')).toBe(true));
  });

  it('follows the Player opting the student in and out', async () => {
    const player = provide([SPOKEN_MATH_NAMES]);
    const el = await mount(player.provider);
    const input = () => el.querySelector('input') as HTMLInputElement;

    await vi.waitFor(() => expect(input().hasAttribute('aria-labelledby')).toBe(false));

    player.answer(['answerMasking']);
    await vi.waitFor(() => expect(input().hasAttribute('aria-labelledby')).toBe(true));
  });
});
