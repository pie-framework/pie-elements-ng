import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';

import TraitTileImport from '../trait';
import { TraitsHeaderTile as TraitsHeaderTileImport } from '../traitsHeader';

// The rich-text inputs have no bearing on the menus.
vi.mock('../common.js', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  UnderlinedInput: () => null,
  ExpandedInput: () => null,
  ScorePoint: () => null,
  SimpleInput: () => null,
}));

// trait.tsx and traitsHeader.tsx are untyped, so they declare no props.
const TraitTile = TraitTileImport as unknown as React.ComponentType<Record<string, unknown>>;
const TraitsHeaderTile = TraitsHeaderTileImport as unknown as React.ComponentType<Record<string, unknown>>;

const trait = (name: string, index: number) => (
  <TraitTile
    key={name}
    index={index}
    trait={{ name, standards: [], scorePointsDescriptors: [], description: '' }}
    traitLabel="Trait"
    scorePointsValues={[]}
    onTraitChanged={vi.fn()}
    onTraitRemoved={vi.fn()}
  />
);

const header = (scaleIndex: number) => (
  <TraitsHeaderTile
    key={scaleIndex}
    scaleIndex={scaleIndex}
    scorePointsValues={[]}
    scorePointsLabels={[]}
    traitLabel="Trait"
    setSecondaryBlockRef={vi.fn()}
    showDeleteScaleModal={vi.fn()}
  />
);

// Two scales, each with two traits.
const Rubric = () => (
  <>
    {header(0)}
    {trait('Clarity', 0)}
    {trait('Grammar', 1)}
    {header(1)}
    {trait('Focus', 0)}
    {trait('Voice', 1)}
  </>
);

const ids = () => [...document.querySelectorAll('[id]')].map((el) => el.id);

const menuButtons = () => [...document.querySelectorAll('[aria-controls]')];

const menuOf = (button: Element) => document.getElementById(button.getAttribute('aria-controls') || '');

afterEach(cleanup);

describe('multi-trait-rubric menus', () => {
  it('repeat no id across traits and scales', () => {
    render(<Rubric />);

    expect(menuButtons()).toHaveLength(6);
    expect(new Set(ids()).size).toBe(ids().length);
  });

  it('point each menu button at its own menu', () => {
    render(<Rubric />);

    const [scaleOne, clarity, grammar, scaleTwo, focus, voice] = menuButtons();
    expect(menuOf(clarity)?.textContent).toContain('Remove Clarity');
    expect(menuOf(grammar)?.textContent).toContain('Remove Grammar');
    expect(menuOf(focus)?.textContent).toContain('Remove Focus');
    expect(menuOf(voice)?.textContent).toContain('Remove Voice');
    expect(menuOf(scaleOne)?.textContent).toContain('Remove Scale');
    expect(menuOf(scaleTwo)?.textContent).toContain('Remove Scale');
    expect(menuOf(scaleOne)).not.toBe(menuOf(scaleTwo));
  });

  it('keep their ids across re-renders', () => {
    const { rerender } = render(<Rubric />);
    const before = ids();

    rerender(<Rubric />);

    expect(ids()).toEqual(before);
  });
});
