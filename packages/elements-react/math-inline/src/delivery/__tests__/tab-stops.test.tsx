import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';

import { Main } from '../main';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

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
  // A focusable wrapper around the fields has no role or name, so it is an empty stop before the first one.
  it('are the answer fields alone', () => {
    const { container } = render(item);

    expect(tabStops(container).map((el) => el.tagName)).toEqual(['TEXTAREA', 'TEXTAREA']);
  });
});
