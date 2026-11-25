import React from 'react';
import { beforeAll, describe, it, expect, vi } from 'vitest';
import { loadLocale } from '@pie-element/shared-i18n';
import { render, screen, fireEvent } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import PossibleResponses from '../possible-responses';

const theme = createTheme();

// The components read their catalogs synchronously; the Spanish case needs them resident.
beforeAll(() => loadLocale('es_ES'));

const choices = [
  { id: 'a1', value: 'Mercury' },
  { id: 'a2', value: 'Venus' },
];

const renderPool = (extras?: any) =>
  render(
    <ThemeProvider theme={theme}>
      <DndContext>
        <PossibleResponses canDrag data={choices} onDragBegin={vi.fn()} {...extras} />
      </DndContext>
    </ThemeProvider>,
  );

const pool = () => screen.getByRole('group');
const choice = (name: string) => screen.getByRole('button', { name });

describe('PossibleResponses tab path', () => {
  it('names the pool', () => {
    renderPool({ selectedResponse: { id: 'a3', value: 'Earth', containerIndex: 0 } });
    expect(screen.getByRole('group', { name: 'Choices list' })).toBe(pool());
  });

  it('names the pool in the item language', () => {
    renderPool({ language: 'es_ES' });
    expect(screen.getByRole('group', { name: 'Lista de opciones' })).toBe(pool());
  });

  it('leaves the tab path to its choices while nothing is selected', () => {
    renderPool();

    expect(pool()).toHaveAttribute('tabindex', '-1');
    expect(choice('Mercury')).toHaveAttribute('tabindex', '0');
    expect(choice('Venus')).toHaveAttribute('tabindex', '0');
  });

  it('is a tab stop while a choice is selected, and its choices are not', () => {
    renderPool({ selectedResponse: { id: 'a3', value: 'Earth', containerIndex: 0 } });

    expect(pool()).toHaveAttribute('tabindex', '0');
    expect(choice('Mercury')).toHaveAttribute('tabindex', '-1');
    expect(choice('Venus')).toHaveAttribute('tabindex', '-1');
  });

  it('takes the selection back on Space, on Enter and on a click', () => {
    const onPlacementClick = vi.fn();
    renderPool({ selectedResponse: { id: 'a3', value: 'Earth', containerIndex: 0 }, onPlacementClick });

    fireEvent.keyDown(pool(), { code: 'Space' });
    fireEvent.keyDown(pool(), { code: 'Enter' });
    fireEvent.click(pool());

    expect(onPlacementClick).toHaveBeenCalledTimes(3);
    expect(onPlacementClick).toHaveBeenCalledWith(undefined);
  });

  it('leaves a key pressed on a choice to the choice, so a keyboard drag can drop it', () => {
    const onPlacementClick = vi.fn();
    renderPool({ selectedResponse: { id: 'a1', value: 'Mercury' }, onPlacementClick });

    fireEvent.keyDown(choice('Mercury'), { code: 'Enter' });

    expect(onPlacementClick).not.toHaveBeenCalled();
  });

  it('is no tab stop and takes no key when dragging is off', () => {
    const onPlacementClick = vi.fn();
    renderPool({ canDrag: false, selectedResponse: { id: 'a3', value: 'Earth', containerIndex: 0 }, onPlacementClick });

    expect(pool()).toHaveAttribute('tabindex', '-1');
    fireEvent.keyDown(pool(), { code: 'Enter' });
    expect(onPlacementClick).not.toHaveBeenCalled();
  });
});
