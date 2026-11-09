import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';

// MathJax loads off a CDN and has no bearing on the names.
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const { default: Dropdown } = await import('../components/dropdown');
const { default: Blank } = await import('../components/blank');

const choices = [{ value: '0', label: 'Jupiter' }];

// The catalog for a language loads on first use: one English frame, then the language.
describe('mask-markup interface language', () => {
  it('renders Spanish once its catalog lands, and follows a language change', async () => {
    const { rerender } = render(<Dropdown id="1" language="es_ES" choices={choices} onChange={vi.fn()} />);

    expect(screen.getByRole('combobox')).toHaveAccessibleName('Query 2');
    expect(await screen.findByRole('combobox', { name: 'Consulta 2' })).toBeInTheDocument();

    rerender(<Dropdown id="1" language="fr" choices={choices} onChange={vi.fn()} />);
    expect(await screen.findByRole('combobox', { name: 'Liste déroulante 2' })).toBeInTheDocument();

    rerender(<Dropdown id="1" language="en-US" choices={choices} onChange={vi.fn()} />);
    expect(screen.getByRole('combobox')).toHaveAccessibleName('Query 2');
  });

  it('names a blank in Spanish, and follows a language change', async () => {
    const blank = (language: string) => (
      <DndContext>
        <Blank id="0" instanceId="dib" onChange={vi.fn()} language={language} />
      </DndContext>
    );
    const { rerender } = render(blank('es'));

    expect(await screen.findByRole('button', { name: 'Espacio en blanco 1' })).toBeInTheDocument();

    rerender(blank('en_US'));
    expect(screen.getByRole('button', { name: 'Blank 1' })).toBeInTheDocument();
  });
});
