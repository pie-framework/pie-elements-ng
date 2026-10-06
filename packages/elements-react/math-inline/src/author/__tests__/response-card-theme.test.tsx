import React from 'react';
import type { CSSProperties } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';

import Response from '../response';

// The dark preset's --pie-background and --pie-text.
const DARK = { '--pie-background': '#1a202c', '--pie-text': '#e2e8f0' } as CSSProperties;

// response.tsx is untyped, so its class declares no props.
const ResponseCard = Response as unknown as React.ComponentType<Record<string, unknown>>;

const renderCard = (vars: CSSProperties) => {
  const { container } = render(
    <div style={vars}>
      <ResponseCard
        mode="scientific"
        response={{ validation: 'literal', answer: '', alternates: {} }}
        onResponseChange={() => {}}
        cIgnoreOrder={{ enabled: false }}
        cAllowTrailingZeros={{ enabled: false }}
      />
    </div>,
  );
  return getComputedStyle(container.querySelector('.MuiCard-root') as Element);
};

afterEach(cleanup);

describe('math-inline authoring Correct Answer card', () => {
  it('follows the scheme background and ink', () => {
    const card = renderCard(DARK);
    expect(card.backgroundColor).toBe('#1a202c');
    expect(card.color).toBe('#e2e8f0');
  });

  it('stays white with no theme', () => {
    expect(renderCard({}).backgroundColor).toBe('#ffffff');
  });
});
