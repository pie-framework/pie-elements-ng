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
});
