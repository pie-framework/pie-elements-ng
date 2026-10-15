import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';

import TextSelect from '../text-select';

const TEXT = 'The storm hit. Mara ran. Rain fell.';
const TOKENS = [
  { text: 'The storm hit.', start: 0, end: 14 },
  { text: 'Mara ran.', start: 15, end: 24 },
  { text: 'Rain fell.', start: 25, end: 35 },
];

const renderText = (props: Record<string, unknown> = {}) => {
  const onChange = vi.fn();
  render(<TextSelect text={TEXT} tokens={TOKENS} selectedTokens={[]} onChange={onChange} {...props} />);
  return onChange;
};

const token = (name: string) => within(screen.getByRole('group')).getByRole('button', { name });

afterEach(cleanup);

describe('TokenSelect token spans', () => {
  it('wraps each token in a span carrying its offsets', () => {
    renderText();

    const wrapper = token('Mara ran.').parentElement as HTMLElement;

    expect(wrapper.dataset).toMatchObject({ tokenStart: '15', tokenEnd: '24' });
    expect(wrapper.children).toHaveLength(1);
  });
});

describe('TokenSelect eliminated tokens', () => {
  it('keeps an eliminated token in the sequence, unavailable', () => {
    renderText({ eliminatedTokens: [{ start: 15, end: 24 }] });

    expect(token('Mara ran.')).toHaveAttribute('aria-disabled', 'true');
    expect(token('Mara ran.')).toHaveAttribute('tabindex');
    expect(token('Mara ran.')).toHaveClass('unavailable');
    expect(token('Rain fell.')).not.toHaveAttribute('aria-disabled');
  });

  it('refuses to select an eliminated token by click or key', () => {
    const onChange = renderText({ eliminatedTokens: [{ start: 15, end: 24 }] });

    fireEvent.click(token('Mara ran.'));
    fireEvent.keyDown(token('Mara ran.'), { key: 'Enter' });
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.click(token('Rain fell.'));
    expect(onChange).toHaveBeenCalledWith([{ start: 25, end: 35 }]);
  });
});
