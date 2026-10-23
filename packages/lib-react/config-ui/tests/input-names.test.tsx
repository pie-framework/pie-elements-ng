import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { InputCheckbox, InputRadio, InputSwitch } from '../src/inputs.js';
import Checkbox from '../src/checkbox.js';
import NumberTextField from '../src/number-text-field.js';
import { Panel, dropdown } from '../src/settings/index.js';

describe('authoring input names', () => {
  it('names a checkbox without a visible label', () => {
    const { getByRole } = render(<Checkbox checked={false} onChange={vi.fn()} label="" ariaLabel="Correct answer for row 1, column 2" />);
    expect(getByRole('checkbox', { name: 'Correct answer for row 1, column 2' })).toBeInTheDocument();
  });

  it('names a number field whose label is provided by its container', () => {
    const { getByRole } = render(<NumberTextField value={3} onChange={vi.fn()} ariaLabel="Layout" />);
    expect(getByRole('spinbutton', { name: 'Layout' })).toBeInTheDocument();
  });

  it('associates each settings dropdown with its own label across author instances', () => {
    const panel = (key: string) => <Panel key={key} model={{ mode: 'one' }} configuration={{}}
      groups={{ Settings: { mode: dropdown('Response mode', ['one', 'many']) } }}
      onChangeModel={vi.fn()} onChangeConfiguration={vi.fn()} />;
    const { getAllByRole } = render(<>{panel('first')}{panel('second')}</>);
    const selects = getAllByRole('combobox', { name: 'Response mode' });
    expect(selects).toHaveLength(2);
    expect(selects[0].getAttribute('aria-labelledby')).not.toBe(selects[1].getAttribute('aria-labelledby'));
  });

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
