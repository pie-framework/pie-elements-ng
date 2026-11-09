import React from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, waitFor } from '@testing-library/react';

import { Main } from '../main';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));
vi.mock('mathlive', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  MathfieldElement: (await import('./fake-mathlive')).FakeMathfieldElement,
}));

// The first render waits for MathLive's module graph to load.
const LOAD = { timeout: 10_000 };

// Load MathLive before the first field mounts, as on a page that already shows math.
beforeAll(async () => {
  const { loadMathLive } = await import('@pie-lib/math-input-mathlive');
  await loadMathLive();
});

// main.tsx is untyped, so its class declares no props.
const MathInline = Main as unknown as React.ComponentType<{ model: object; session: object; onSessionChange: () => void }>;

const item = (mode: 'gather' | 'evaluate') => (
  <MathInline
    model={{
      disabled: mode === 'evaluate',
      correctness: mode === 'evaluate' ? { correctness: 'incorrect' } : undefined,
      config: {
        id: '1',
        expression: '{{response}} + 1 = {{response}}',
        responseType: 'Advanced Multi',
        responses: [{ id: '1', answer: 'x', alternates: {} }],
        env: { mode, role: 'student' },
      },
    }}
    session={{ answers: { r1: { value: '1' }, r2: { value: '2' } } }}
    onSessionChange={vi.fn()}
  />
);

const instructions = (root: ParentNode) =>
  [...root.querySelectorAll('.sr-only')].filter((el) => el.id.startsWith('math-inline-instructions'));

describe('math-inline keypad', () => {
  it('describes the answer field with the keypad instructions', async () => {
    const { container } = render(item('gather'));

    await waitFor(() => expect(container.querySelector('math-field')).not.toBeNull(), LOAD);
    expect(instructions(container)).toHaveLength(1);
    expect(container.querySelector('math-field')?.getAttribute('aria-describedby')).toEqual(instructions(container)[0].id);
  });

  it('has no keypad instructions in evaluate mode, where there is no field to type into', async () => {
    const { container } = render(item('evaluate'));

    await waitFor(() => expect(container.querySelector('[data-answer-block="r1"]')).not.toBeNull(), LOAD);
    expect(container.querySelector('math-field')).toBeNull();
    expect(instructions(container)).toHaveLength(0);
    expect(container.querySelector('[aria-describedby]')).toBeNull();
  });

  // MathLive takes focus only after the click, so the click itself has to open the keypad.
  it('opens on a click on the answer field, before the field has focus', async () => {
    const { container } = render(item('gather'));

    await waitFor(() => expect(container.querySelector('math-field')).not.toBeNull(), LOAD);
    fireEvent.click(container.querySelector('math-field') as Element);

    await waitFor(() => expect(document.querySelector('[data-keypad]')).not.toBeNull());
  });
});
