import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const { MultipleChoice } = await import('../multiple-choice');
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

  it('names the group in the item language', async () => {
    render(item({ language: 'es_ES' }));
    // Rendered without the element, nothing preloads: the component loads its catalog itself.
    expect(await screen.findByRole('radiogroup', { name: 'Opciones de respuesta' })).toBeInTheDocument();
  });

  it.each([
    ['en_US', 'Part A', 'Part A, answer choices'],
    ['es_ES', 'Parte A', 'Parte A, opciones de respuesta'],
  ])('names an EBSR part group by its part label in %s', async (language, partLabel, name) => {
    render(item({ language, partLabel }));
    expect(await screen.findByRole('radiogroup', { name })).toBeInTheDocument();
  });

  it('names a math choice by its key and a note, and a text choice by its label', () => {
    render(item());
    const [math, text] = screen.getAllByRole('radio');

    expect(labelledByName(math)).toBe('A. Pick the answer below');
    // Hidden from read-aloud, which reads the key and the math from the screen.
    for (const id of (math.getAttribute('aria-labelledby') || '').split(' ')) {
      expect(document.getElementById(id)?.classList.contains('pie-sr-only')).toBe(true);
    }
    expect(text.hasAttribute('aria-labelledby')).toBe(false);
    expect(screen.getByRole('radio', { name: 'B 25 and 200' })).toBe(text);
  });

  it('names a table choice by its key and a note', () => {
    render(item({ choices: [{ value: 'a', label: '<table><tr><td>1</td><td>2</td></tr></table>' }] }));
    expect(labelledByName(screen.getByRole('radio'))).toBe('A. Pick the answer below');
  });

  it('keeps the key text of an image choice', () => {
    render(item({ choices: [{ value: 'a', label: '<img src="x.png" alt="A circle">' }] }));
    const [image] = screen.getAllByRole('radio');

    expect(image.hasAttribute('aria-labelledby')).toBe(false);
    expect(document.getElementById(`${image.id}-desc`)?.textContent).toBe('Pick the answer below, A');
  });

  it('says the key text of an image choice in the item language', async () => {
    render(item({ language: 'es_ES', choices: [{ value: 'a', label: '<img src="x.png" alt="A circle">' }] }));
    await screen.findByRole('radiogroup', { name: 'Opciones de respuesta' });
    const [image] = screen.getAllByRole('radio');

    expect(document.getElementById(`${image.id}-desc`)?.textContent).toBe('Seleccione la respuesta de abajo, A');
  });

  it('keeps the note in the item language', async () => {
    render(item({ language: 'es_ES' }));
    await screen.findByRole('radiogroup', { name: 'Opciones de respuesta' });
    const [math] = screen.getAllByRole('radio');

    expect(labelledByName(math)).toBe('A. Seleccione la respuesta de abajo');
  });

  it('names a math choice with no key by its position', () => {
    render(item({ keyMode: 'none', choices: [CHOICES[1], CHOICES[0]] }));
    const [text, math] = screen.getAllByRole('radio');

    expect(labelledByName(math)).toBe('2. Pick the answer below');
    expect(text.hasAttribute('aria-labelledby')).toBe(false);
    expect(screen.getByRole('radio', { name: '25 and 200' })).toBe(text);
  });

  it('names checkbox choices the same way', () => {
    render(item({ choiceMode: 'checkbox' }));
    const [math] = screen.getAllByRole('checkbox');

    expect(screen.getByRole('group', { name: 'Answer choices' })).toBeInTheDocument();
    expect(labelledByName(math)).toBe('A. Pick the answer below');
  });

  it('names math choices by their key and a note in the element, with no Player', async () => {
    type Host = HTMLElement & { model: object; session: object };
    customElements.define('test-mc-math-names', MultipleChoiceElement as unknown as CustomElementConstructor);
    const el = document.createElement('test-mc-math-names') as Host;
    document.body.appendChild(el);
    el.model = { mode: 'gather', choiceMode: 'radio', keyMode: 'letters', prompt: PROMPT, choices: CHOICES };
    el.session = { value: [] };

    await vi.waitFor(() => expect(el.querySelector('input')).not.toBeNull());
    expect(labelledByName(el.querySelector('input') as HTMLInputElement)).toBe('A. Pick the answer below');
  });
});
