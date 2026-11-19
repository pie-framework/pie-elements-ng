import { render, screen } from '@testing-library/react';
import React from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { loadLocale } from '@pie-element/shared-i18n';
import Palette from '../drawable-palette';

// The element loads the item's locale before it renders; these render its parts directly.
beforeAll(() => loadLocale('es_ES'));

const props = {
  fillColor: 'transparent',
  fillList: [
    { value: 'transparent', label: 'No fill' },
    { value: 'lightblue', label: 'Light blue' },
  ],
  outlineColor: 'black',
  outlineList: [{ value: 'black', label: 'Black' }],
  onFillColorChange: vi.fn(),
  onOutlineColorChange: vi.fn(),
  onPaintColorChange: vi.fn(),
};

describe('drawing palette', () => {
  it('names each color select after its visible label', () => {
    render(<Palette {...props} />);

    expect(screen.getByRole('combobox', { name: 'Fill color' })).toHaveTextContent('No fill');
    expect(screen.getByRole('combobox', { name: 'Outline color' })).toHaveTextContent('Black');
  });

  it('names the selects in the item language', () => {
    const spanishProps = { ...props, language: 'es_ES' };
    render(<Palette {...spanishProps} />);

    expect(screen.getByRole('combobox', { name: 'Color de relleno' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Color del contorno' })).toBeInTheDocument();
  });
});
