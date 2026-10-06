/**
 * Feedback text sits in the page's ink on a tinted status surface, and a host's
 * `--feedback-*` custom properties still take precedence.
 */
import { afterEach, describe, expect, it } from 'vitest';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot, type Root } from 'react-dom/client';
import { Feedback } from '../src/feedback';

let root: Root | undefined;
let host: HTMLElement | undefined;

function render(element: React.ReactElement, hostStyle = '') {
  host = document.createElement('div');
  host.setAttribute('style', hostStyle);
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root?.render(element));
  return host;
}

function content(container: HTMLElement, correctness: string) {
  const node = container.querySelector(`.${correctness}`) as HTMLElement;
  const style = getComputedStyle(node);
  // happy-dom resolves var() chains to the declared value without normalising it.
  return { node, color: style.color.toLowerCase(), background: style.backgroundColor.toLowerCase() };
}

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = undefined;
  host = undefined;
});

describe('Feedback', () => {
  it('renders nothing without both correctness and feedback', () => {
    const container = render(<Feedback correctness="correct" />);
    expect(container.textContent).toBe('');
  });

  it.each([
    ['correct', '#e8f5e9'],
    ['incorrect', '#ffebee'],
  ])('puts %s feedback in the page ink on its status tint', (correctness, tint) => {
    const container = render(<Feedback correctness={correctness} feedback="<p>Feedback.</p>" />);
    const { node, color, background } = content(container, correctness);

    expect(node.textContent).toBe('Feedback.');
    expect(color).toBe('black');
    expect(background).toBe(tint);
  });

  it('puts other feedback on the recessed surface', () => {
    const container = render(<Feedback correctness="unanswered" feedback="Nothing yet." />);
    const { color, background } = content(container, 'unanswered');

    expect(color).toBe('black');
    expect(background).toBe('#ecedf1');
  });

  it('follows the theme tokens a host sets', () => {
    const container = render(
      <Feedback correctness="incorrect" feedback="No." />,
      '--pie-text: rgb(1, 2, 3); --pie-incorrect-secondary: rgb(4, 5, 6)'
    );
    const { color, background } = content(container, 'incorrect');

    expect(color).toBe('rgb(1, 2, 3)');
    expect(background).toBe('rgb(4, 5, 6)');
  });

  it('keeps the host feedback overrides ahead of the theme tokens', () => {
    const container = render(
      <Feedback correctness="correct" feedback="Yes." />,
      '--pie-text: rgb(1, 2, 3); --feedback-color: rgb(7, 8, 9); --feedback-correct-bg-color: rgb(10, 11, 12)'
    );
    const { color, background } = content(container, 'correct');

    expect(color).toBe('rgb(7, 8, 9)');
    expect(background).toBe('rgb(10, 11, 12)');
  });
});
