import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import CorrectResponse from '../correct-response-icon';

describe('CorrectResponse icon', () => {
  it.each([true, false])('is decorative when open is %s', (open) => {
    const { container } = render(<CorrectResponse open={open} />);
    const svg = container.querySelector('svg');

    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('focusable', 'false');
  });

  it('leaves the name of the control around it to the label', () => {
    render(
      <button type="button">
        <CorrectResponse open />
        <CorrectResponse />
        Show correct answer
      </button>,
    );

    expect(screen.getByRole('button')).toHaveAccessibleName('Show correct answer');
  });
});
