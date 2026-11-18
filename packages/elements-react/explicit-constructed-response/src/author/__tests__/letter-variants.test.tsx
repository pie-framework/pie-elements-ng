import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import Main from '../main.js';
import defaults from '../defaults.js';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const HELP = 'Accepts أ إ آ ٱ as ا, ignores tashkeel, accepts ه for ة and ي for ى.';

const area = (index: number, value: string) =>
  `<span data-type="explicit_constructed_response" data-index="${index}" data-value="${value}"></span>`;

// Fresh per mount: the author edits `choices` and `maxLengthPerChoice` in place.
const itemModel = () => ({
  ...defaults.model,
  maxLengthPerChoiceEnabled: false,
  markup: '<p>الطالب في {{0}} اسمها {{1}}.</p>',
  slateMarkup: `<p>الطالب في ${area(0, 'مدرسة')} اسمها ${area(1, 'أحمد')}.</p>`,
  choices: {
    0: [{ label: 'مدرسة', value: '0' }],
    1: [{ label: 'أحمد', value: '0' }],
  },
  maxLengthPerChoice: [8, 7],
});

const mount = (model: Record<string, unknown> = {}, configuration: Record<string, unknown> = {}) => {
  const onModelChanged = vi.fn();
  const ref = React.createRef<Main>();
  render(
    <Main
      ref={ref}
      model={{ ...itemModel(), ...model } as any}
      configuration={{ ...defaults.configuration, ...configuration } as any}
      onModelChanged={onModelChanged}
      onConfigurationChanged={vi.fn()}
    />
  );
  return { onModelChanged, main: ref.current as Main };
};

// Without a measured width the layout puts the settings on a tab of their own.
const openSettings = () => fireEvent.click(screen.getByRole('tab', { name: 'Settings' }));

// The help text's own words: the test DOM spaces out the Arabic runs when it computes a description.
const description = (input: HTMLElement) =>
  document.getElementById(input.getAttribute('aria-describedby') ?? '')?.textContent;

const areaSwitches = () => screen.queryAllByRole('switch', { name: /^Accept Arabic spelling variants for response area/ });

describe('Arabic spelling variants authoring', () => {
  it('offers the panel switch off, described by the variants it accepts, with no per-area toggles', () => {
    const { onModelChanged } = mount();
    expect(areaSwitches()).toHaveLength(0);
    openSettings();
    const panelSwitch = screen.getByRole('switch', { name: 'Accept Arabic Spelling Variants' });

    expect(panelSwitch).not.toBeChecked();
    expect(description(panelSwitch)).toBe(HELP);

    fireEvent.click(panelSwitch);

    expect(onModelChanged).toHaveBeenLastCalledWith(expect.objectContaining({ foldLetterVariantsEnabled: true }));
  });

  it('names the panel switch after the configuration', () => {
    mount({}, { foldLetterVariants: { settings: true, label: 'Accept spelling variants' } });
    openSettings();
    expect(screen.getByRole('switch', { name: 'Accept spelling variants' })).toBeInTheDocument();
  });

  it('leaves the panel switch out when the configuration does not offer it', () => {
    mount({}, { foldLetterVariants: { settings: false } });
    openSettings();
    expect(screen.getByRole('switch', { name: 'Ignore Accents' })).toBeInTheDocument();
    expect(screen.queryByRole('switch', { name: 'Accept Arabic Spelling Variants' })).toBeNull();
  });

  it('lists every response area with its own toggle once the switch is on', () => {
    const { onModelChanged } = mount({ foldLetterVariantsEnabled: true, foldLetterVariantsPerChoice: [false, true] });
    const [first, second] = areaSwitches();

    expect(areaSwitches().map((input) => input.getAttribute('aria-label'))).toEqual([
      'Accept Arabic spelling variants for response area 1',
      'Accept Arabic spelling variants for response area 2',
    ]);
    expect(first).not.toBeChecked();
    expect(second).toBeChecked();
    expect(description(first)).toBe(HELP);
    expect(first.getAttribute('aria-describedby')).not.toBe(second.getAttribute('aria-describedby'));
    expect(screen.getAllByText('Accept Arabic spelling variants')).toHaveLength(2);

    fireEvent.click(first);

    expect(onModelChanged).toHaveBeenLastCalledWith({ foldLetterVariantsPerChoice: [true, true] });
  });

  it('writes a dense entry list for an item that has none', () => {
    const { onModelChanged } = mount({ foldLetterVariantsEnabled: true });

    fireEvent.click(areaSwitches()[1]);

    expect(onModelChanged).toHaveBeenLastCalledWith({ foldLetterVariantsPerChoice: [false, true] });
  });

  it('moves each area’s entry with it when the markup reorders or deletes areas', () => {
    const { main, onModelChanged } = mount({ foldLetterVariantsEnabled: true, foldLetterVariantsPerChoice: [true, false] });

    act(() => main.onChange(`<p>${area(1, 'أحمد')} ${area(0, 'مدرسة')}</p>`));
    expect(onModelChanged).toHaveBeenLastCalledWith(
      expect.objectContaining({ foldLetterVariantsPerChoice: [false, true], maxLengthPerChoice: [7, 8] })
    );

    act(() => main.onChange(`<p>${area(0, 'مدرسة')}</p>`));
    expect(onModelChanged).toHaveBeenLastCalledWith(expect.objectContaining({ foldLetterVariantsPerChoice: [true] }));
  });

  it('leaves the entries out of the model of an item that has none', () => {
    const { main, onModelChanged } = mount();

    act(() => main.onChange(`<p>${area(1, 'أحمد')} ${area(0, 'مدرسة')}</p>`));

    expect(onModelChanged.mock.lastCall?.[0]).not.toHaveProperty('foldLetterVariantsPerChoice');
  });

  it('starts a new response area strict, whatever entry its index has', () => {
    const { main, onModelChanged } = mount({ foldLetterVariantsEnabled: true, foldLetterVariantsPerChoice: [false, false, true] });

    act(() => main.onChangeResponse('2', 'كتاب'));

    expect(onModelChanged).toHaveBeenLastCalledWith(
      expect.objectContaining({ foldLetterVariantsPerChoice: [false, false, false] })
    );
  });
});
