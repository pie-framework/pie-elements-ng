import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Panel, toggle } from '../src/settings/index.js';

describe('settings panel toggle', () => {
  it('is a switch named by its label', () => {
    const onChangeModel = vi.fn();
    render(
      <Panel
        model={{ mathInput: false, spanishInput: true }}
        groups={{ Settings: { mathInput: toggle('Math input'), spanishInput: toggle('Spanish input') } }}
        onChangeModel={onChangeModel}
      />
    );

    expect(screen.getByRole('switch', { name: 'Spanish input' })).toBeChecked();
    fireEvent.click(screen.getByRole('switch', { name: 'Math input' }));

    expect(onChangeModel).toHaveBeenCalledWith({ mathInput: true, spanishInput: true }, 'mathInput');
  });

  it('is described by the help text shown under it', () => {
    render(
      <Panel
        model={{}}
        groups={{
          Settings: {
            mathInput: { ...toggle('Math input'), helperText: 'Adds a math keypad.' },
            spanishInput: toggle('Spanish input'),
          },
        }}
      />
    );

    expect(screen.getByRole('switch', { name: 'Math input' })).toHaveAccessibleDescription('Adds a math keypad.');
    expect(screen.getByRole('switch', { name: 'Spanish input' })).not.toHaveAttribute('aria-describedby');
  });
});
