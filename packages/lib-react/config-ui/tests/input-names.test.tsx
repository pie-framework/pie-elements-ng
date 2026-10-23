import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { InputCheckbox, InputRadio, InputSwitch } from '../src/inputs.js';

describe('authoring input names', () => {
  for (const [name, Input] of Object.entries({ InputCheckbox, InputRadio, InputSwitch })) {
    it(`${name} names its native input and preserves changes`, () => {
      const onChange = vi.fn();
      const { container } = render(<Input label="Enabled" checked={false} onChange={onChange} />);
      const input = container.querySelector('input')!;

      expect(input).toHaveAccessibleName('Enabled');
      fireEvent.click(input);
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it(`${name} can be named when its visual label is hidden`, () => {
      const { container } = render(<Input label="" ariaLabel="Correct answer for choice A" onChange={vi.fn()} />);

      expect(container.querySelector('input')).toHaveAccessibleName('Correct answer for choice A');
    });
  }
});
