import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { Main } from '../main';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const MatchList = Main as unknown as React.ComponentType<{ model: object; session: object; onSessionChange: () => void }>;

const model = {
  mode: 'gather',
  config: {
    prompt: 'Match each event to its year.',
    prompts: [{ id: 1, title: 'Boston Tea Party', relatedAnswer: 3 }],
    answers: [{ id: 3, title: '1773' }],
  },
};

describe('match-list result announcements', () => {
  it('change on every select and deselect, so a repeated one is announced again', () => {
    const { container } = render(<MatchList model={model} session={{ value: {} }} onSessionChange={vi.fn()} />);
    const region = container.querySelector('[role="status"][aria-live="polite"]') as HTMLElement;
    const choice = screen.getByRole('button', { name: 'Answer choice: 1773' });
    const seen: string[] = [];

    for (let i = 0; i < 4; i++) {
      fireEvent.click(choice);
      seen.push(region.textContent || '');
    }

    expect(seen).toEqual([
      'Selected answer choice 1773. Use TAB to choose a drop area.',
      'Answer choice 1773 is no longer selected. Use TAB to select an answer choice.',
      'Selected answer choice 1773. Use TAB to choose a drop area.',
      'Answer choice 1773 is no longer selected. Use TAB to select an answer choice.',
    ]);
    // Never two equal messages in a row, which a live region would swallow.
    seen.forEach((message, i) => i > 0 && expect(message).not.toBe(seen[i - 1]));
  });
});
