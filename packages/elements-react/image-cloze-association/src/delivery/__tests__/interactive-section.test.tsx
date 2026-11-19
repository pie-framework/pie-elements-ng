import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import InteractiveSectionComponent from '../interactive-section';

// The class declares no prop types for TypeScript.
const InteractiveSection = InteractiveSectionComponent as React.ComponentType<any>;

vi.mock('../evaluation-icon', () => ({
  default: () => <span data-part="evaluation" />,
}));

const theme = createTheme();

// The image, then the warning and the pool as root.tsx passes them.
const layoutFor = (possibilityListPosition?: string) => {
  const { container } = render(
    <ThemeProvider theme={theme}>
      <InteractiveSection uiStyle={{ possibilityListPosition }}>
        <div data-part="image" />
        {[<div key="warning" data-part="warning" />, <div key="pool" data-part="pool" />]}
      </InteractiveSection>
    </ThemeProvider>,
  );
  const parts = Array.from(container.querySelectorAll('[data-part]'));
  const section = parts[0].parentElement as HTMLElement;

  return { order: parts.map((part) => part.getAttribute('data-part')), flexDirection: section.style.flexDirection };
};

describe('InteractiveSection possibilityListPosition', () => {
  it.each([
    ['bottom', ['evaluation', 'image', 'warning', 'pool'], 'column'],
    ['right', ['evaluation', 'image', 'warning', 'pool'], 'row'],
    [undefined, ['evaluation', 'image', 'warning', 'pool'], 'column'],
    // Shown first, so first in the DOM, in the order the reversed direction showed them.
    ['top', ['pool', 'warning', 'image', 'evaluation'], 'column'],
    ['left', ['pool', 'warning', 'image', 'evaluation'], 'row'],
  ])('puts the responses %s the image in the DOM as on screen', (position, order, flexDirection) => {
    expect(layoutFor(position)).toEqual({ order, flexDirection });
  });
});
