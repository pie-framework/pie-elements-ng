import React from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';

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

const item = (
  <MathInline
    model={{
      config: {
        id: '1',
        expression: '{{response}} + 1 = {{response}}',
        responseType: 'Advanced Multi',
        responses: [{ id: '1', answer: 'x', alternates: {} }],
        env: { mode: 'gather', role: 'student' },
      },
    }}
    session={{ answers: { r1: { value: '' }, r2: { value: '' } } }}
    onSessionChange={vi.fn()}
  />
);

const tabStops = (root: ParentNode) =>
  [...root.querySelectorAll('a[href], button, input, select, textarea, [tabindex]')].filter(
    (el) => el.getAttribute('tabindex') !== '-1' && !(el as HTMLButtonElement).disabled,
  );

describe('math-inline tab stops', () => {
  // A focusable wrapper around the field has no role or name, so it is an empty stop before it. The
  // answer blocks are prompts of one MathLive field, which is a single stop.
  it('are the answer field alone', async () => {
    const { container } = render(item);

    await waitFor(() => expect(tabStops(container).map((el) => el.tagName)).toEqual(['MATH-FIELD']), LOAD);
  });
});
