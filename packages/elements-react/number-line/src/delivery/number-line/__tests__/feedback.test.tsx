import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import Feedback from '../feedback';

// feedback.tsx is untyped, so its component declares no props.
const Panel = Feedback as unknown as React.ComponentType<Record<string, unknown>>;

function panelBackground(type: string, hostStyle: Record<string, string> = {}) {
  render(
    <div style={hostStyle}>
      <Panel type={type} width={300} message="Message." />
    </div>,
  );
  const panel = screen.getByText('Message.').parentElement!;
  // happy-dom resolves var() chains to the declared value without normalising it.
  return getComputedStyle(panel).backgroundColor.toLowerCase();
}

describe('number line feedback panel', () => {
  it.each([
    ['correct', '#e8f5e9'],
    ['incorrect', '#ffebee'],
    ['partial', '#ecedf1'],
    ['unanswered', '#ecedf1'],
    ['info', '#ecedf1'],
  ])('fills a %s panel with its tinted surface under no theme', (type, fill) => {
    expect(panelBackground(type)).toBe(fill);
  });

  it.each([
    ['correct', '--pie-correct-secondary'],
    ['incorrect', '--pie-incorrect-secondary'],
    ['info', '--pie-background-dark'],
  ])('fills a %s panel with the scheme %s', (type, token) => {
    expect(panelBackground(type, { [token]: 'rgb(1, 2, 3)' })).toBe('rgb(1, 2, 3)');
  });
});
