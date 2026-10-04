import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import Root from '../root';
import { create as createGraphProps } from '../graph-props';

const axis = { min: 0, max: 10, step: 1 };
const graphProps = createGraphProps(axis, axis, { width: 200, height: 200 }, () => null);

describe('plot root', () => {
  it('names and describes its svg', () => {
    render(
      <Root graphProps={graphProps} ariaLabel="Fruit sales" ariaDescription="Bar chart. 2 categories: Apples, Pears.">
        <g />
      </Root>,
    );

    const svg = screen.getByRole('group', { name: 'Fruit sales' });

    expect(svg.tagName.toLowerCase()).toBe('svg');
    expect(svg).toHaveAccessibleDescription('Bar chart. 2 categories: Apples, Pears.');
    expect(svg).not.toHaveAttribute('tabindex');
  });

  it('gives each root its own description', () => {
    render(
      <>
        <Root graphProps={graphProps} ariaLabel="First" ariaDescription="One">
          <g />
        </Root>
        <Root graphProps={graphProps} ariaLabel="Second" ariaDescription="Two">
          <g />
        </Root>
      </>,
    );

    expect(screen.getByRole('group', { name: 'First' })).toHaveAccessibleDescription('One');
    expect(screen.getByRole('group', { name: 'Second' })).toHaveAccessibleDescription('Two');
  });

  it('leaves an unnamed svg without a role', () => {
    const { container } = render(
      <Root graphProps={graphProps}>
        <g />
      </Root>,
    );

    const svg = container.querySelector('svg');

    expect(svg).not.toHaveAttribute('role');
    expect(svg).not.toHaveAttribute('aria-describedby');
    expect(svg?.querySelector('desc')).toBeNull();
  });
});
