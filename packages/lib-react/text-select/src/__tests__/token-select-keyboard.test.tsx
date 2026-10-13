import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';

import TextSelect from '../text-select';

type Span = { start: number; end: number };

// Four sentence tokens with untokenized text (the spaces) between them.
const TEXT = 'The storm hit at dawn. Mara ran to the barn. Rain flooded the valley road. She found the calf asleep.';
const TOKENS = [
  { text: 'The storm hit at dawn.', start: 0, end: 22 },
  { text: 'Mara ran to the barn.', start: 23, end: 44 },
  { text: 'Rain flooded the valley road.', start: 45, end: 74 },
  { text: 'She found the calf asleep.', start: 75, end: 101 },
];

type Props = {
  selected?: Span[];
  maxNoOfSelections?: number;
  disabled?: boolean;
  animationsDisabled?: boolean;
  highlightChoices?: boolean;
  language?: string;
  tokens?: typeof TOKENS;
  onChange?: (selection: Span[]) => void;
};

// Keeps the selection in state, as the delivery element does, so each change re-renders the text.
const Harness = ({ selected = [], onChange, tokens = TOKENS, ...rest }: Props) => {
  const [selectedTokens, setSelectedTokens] = React.useState<Span[]>(selected);

  return (
    <TextSelect
      text={TEXT}
      tokens={tokens}
      selectedTokens={selectedTokens}
      onChange={(selection: Span[]) => {
        onChange?.(selection);
        setSelectedTokens(selection);
      }}
      {...rest}
    />
  );
};

const renderText = (props: Props = {}) => {
  const onChange = vi.fn();
  render(<Harness onChange={onChange} {...props} />);
  return { onChange, group: screen.getByRole('group') };
};

const tokenButtons = () => within(screen.getByRole('group')).getAllByRole('button');

const token = (name: string) => within(screen.getByRole('group')).getByRole('button', { name });

const tabStops = () => tokenButtons().filter((el) => el.getAttribute('tabindex') === '0');

const press = (key: string) => {
  act(() => {
    fireEvent.keyDown(document.activeElement as Element, { key });
  });
};

const focus = (el: HTMLElement) => {
  act(() => {
    el.focus();
  });
};

afterEach(cleanup);

describe('TokenSelect tab stop', () => {
  it('gives the text one tab stop, on the first token when nothing is selected', () => {
    renderText({ maxNoOfSelections: 2 });

    expect(tokenButtons()).toHaveLength(4);
    expect(tabStops()).toEqual([token('The storm hit at dawn.')]);
    for (const el of tokenButtons().slice(1)) {
      expect(el).toHaveAttribute('tabindex', '-1');
    }
  });

  it('puts the tab stop on the first selected token', () => {
    renderText({ selected: [{ start: 45, end: 74 }, { start: 75, end: 101 }] });

    expect(tabStops()).toEqual([token('Rain flooded the valley road.')]);
  });

  it('keeps the tab stop on the token focused last', () => {
    const { group } = renderText({ selected: [{ start: 0, end: 22 }] });

    focus(token('She found the calf asleep.'));
    act(() => {
      (document.activeElement as HTMLElement).blur();
    });

    expect(group).not.toContainElement(document.activeElement as HTMLElement);
    expect(tabStops()).toEqual([token('She found the calf asleep.')]);
  });

  it('leaves the untokenized text out of the sequence', () => {
    const { group } = renderText();

    expect(group.querySelectorAll('[tabindex]')).toHaveLength(4);
    expect(tokenButtons().map((el) => el.textContent)).toEqual(TOKENS.map((t) => t.text));
  });
});

describe('TokenSelect arrow keys', () => {
  it('moves to the next and previous token with Right / Down and Left / Up, stopping at the ends', () => {
    renderText();
    focus(token('The storm hit at dawn.'));

    press('ArrowLeft');
    expect(document.activeElement).toBe(token('The storm hit at dawn.'));

    press('ArrowRight');
    expect(document.activeElement).toBe(token('Mara ran to the barn.'));

    press('ArrowDown');
    expect(document.activeElement).toBe(token('Rain flooded the valley road.'));

    press('ArrowDown');
    press('ArrowRight');
    expect(document.activeElement).toBe(token('She found the calf asleep.'));

    press('ArrowUp');
    expect(document.activeElement).toBe(token('Rain flooded the valley road.'));

    press('ArrowLeft');
    expect(document.activeElement).toBe(token('Mara ran to the barn.'));
  });

  it('moves to the first and last token with Home and End', () => {
    renderText();
    focus(token('Mara ran to the barn.'));

    press('End');
    expect(document.activeElement).toBe(token('She found the calf asleep.'));

    press('Home');
    expect(document.activeElement).toBe(token('The storm hit at dawn.'));
  });

  it('moves the tab stop with focus', () => {
    renderText();
    focus(token('The storm hit at dawn.'));

    press('End');

    expect(tabStops()).toEqual([token('She found the calf asleep.')]);
  });

  it('leaves arrow keys with a modifier to the browser', () => {
    renderText();
    focus(token('The storm hit at dawn.'));

    act(() => {
      fireEvent.keyDown(document.activeElement as Element, { key: 'ArrowRight', altKey: true });
    });

    expect(document.activeElement).toBe(token('The storm hit at dawn.'));
  });
});

describe('TokenSelect toggling', () => {
  it.each([' ', 'Enter'])('toggles the focused token with %j and keeps focus on it', (key) => {
    const { onChange } = renderText({ maxNoOfSelections: 2 });
    focus(token('Mara ran to the barn.'));

    press(key);

    expect(onChange).toHaveBeenLastCalledWith([{ start: 23, end: 44 }]);
    expect(token('Mara ran to the barn.')).toHaveAttribute('aria-pressed', 'true');
    // The text re-rendered from its HTML string, and focus came back to the new element.
    expect(document.activeElement).toBe(token('Mara ran to the barn.'));
    expect(tabStops()).toEqual([token('Mara ran to the barn.')]);

    press(key);

    expect(onChange).toHaveBeenLastCalledWith([]);
    expect(token('Mara ran to the barn.')).toHaveAttribute('aria-pressed', 'false');
    expect(document.activeElement).toBe(token('Mara ran to the barn.'));
  });

  it('ignores a held key', () => {
    const { onChange } = renderText();
    focus(token('Mara ran to the barn.'));

    act(() => {
      fireEvent.keyDown(document.activeElement as Element, { key: ' ', repeat: true });
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('reports the same selection for a key press as for a click', () => {
    const keyed = renderText();
    focus(token('Rain flooded the valley road.'));
    press(' ');
    cleanup();

    const clicked = renderText();
    act(() => {
      fireEvent.click(token('Rain flooded the valley road.'));
    });

    expect(keyed.onChange.mock.calls).toEqual(clicked.onChange.mock.calls);
  });

  it('moves the tab stop to a clicked token', () => {
    const { onChange } = renderText();
    focus(token('She found the calf asleep.'));

    act(() => {
      fireEvent.click(token('She found the calf asleep.'));
    });

    expect(onChange).toHaveBeenLastCalledWith([{ start: 75, end: 101 }]);
    expect(tabStops()).toEqual([token('She found the calf asleep.')]);
    expect(document.activeElement).toBe(token('She found the calf asleep.'));
  });

  it('deselects the previous token when maxSelections is 1, as a click does', () => {
    const { onChange } = renderText({ maxNoOfSelections: 1, selected: [{ start: 0, end: 22 }] });
    focus(token('The storm hit at dawn.'));

    press('ArrowRight');
    press(' ');

    expect(onChange).toHaveBeenLastCalledWith([{ start: 23, end: 44 }]);
    expect(token('The storm hit at dawn.')).toHaveAttribute('aria-pressed', 'false');
    expect(token('Mara ran to the barn.')).toHaveAttribute('aria-pressed', 'true');
    expect(document.activeElement).toBe(token('Mara ran to the barn.'));
    for (const el of tokenButtons()) {
      expect(el).not.toHaveAttribute('aria-disabled');
    }
  });
});

describe('TokenSelect at the selection limit', () => {
  const atLimit = { maxNoOfSelections: 2, selected: [{ start: 0, end: 22 }, { start: 23, end: 44 }] };

  it('keeps unselected tokens in the sequence as unavailable', () => {
    renderText(atLimit);

    expect(tokenButtons()).toHaveLength(4);
    expect(token('Rain flooded the valley road.')).toHaveAttribute('aria-disabled', 'true');
    expect(token('She found the calf asleep.')).toHaveAttribute('aria-disabled', 'true');
    expect(token('The storm hit at dawn.')).not.toHaveAttribute('aria-disabled');
    expect(token('Rain flooded the valley road.')).toHaveAccessibleDescription('3 of 4');
  });

  it('reaches unavailable tokens with the arrow keys and does nothing on Space or Enter', () => {
    const { onChange } = renderText(atLimit);
    focus(token('Mara ran to the barn.'));

    press('ArrowRight');
    expect(document.activeElement).toBe(token('Rain flooded the valley road.'));

    press(' ');
    press('Enter');
    act(() => {
      fireEvent.click(token('Rain flooded the valley road.'));
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('gives unavailable tokens no token styling, as plain text has none', () => {
    renderText({ ...atLimit, highlightChoices: true });

    expect([...token('Rain flooded the valley road.').classList].filter((c) => !c.startsWith('css-'))).toEqual([
      'tokenRootClass',
      'unavailable',
    ]);
  });

  it('frees the other tokens once one is deselected', () => {
    renderText(atLimit);
    focus(token('Mara ran to the barn.'));

    press(' ');

    expect(token('Rain flooded the valley road.')).not.toHaveAttribute('aria-disabled');
    expect(document.activeElement).toBe(token('Mara ran to the barn.'));
  });
});

describe('TokenSelect accessible names', () => {
  it('names the group and describes each token by its position', () => {
    renderText({ maxNoOfSelections: 2 });

    expect(screen.getByRole('group', { name: 'Selectable text, select up to 2' })).toBeInTheDocument();
    expect(token('The storm hit at dawn.')).toHaveAccessibleDescription('1 of 4');
    expect(token('She found the calf asleep.')).toHaveAccessibleDescription('4 of 4');
    expect(token('The storm hit at dawn.')).toHaveAttribute('aria-pressed', 'false');
  });

  it('leaves the limit out of the group name when there is none', () => {
    renderText({ maxNoOfSelections: 0 });

    expect(screen.getByRole('group', { name: 'Selectable text' })).toBeInTheDocument();
  });

  it('names the group and positions in the item language', () => {
    renderText({ maxNoOfSelections: 2, language: 'es_ES' });

    expect(screen.getByRole('group', { name: 'Texto seleccionable, selecciona hasta 2' })).toBeInTheDocument();
    expect(token('Mara ran to the barn.')).toHaveAccessibleDescription('2 de 4');
  });
});

describe('TokenSelect outside gather', () => {
  const evaluated = [
    { ...TOKENS[0], correct: true },
    { ...TOKENS[1], correct: false },
    { ...TOKENS[2], correct: true, isMissing: true },
    TOKENS[3],
  ];
  const answered = [{ start: 0, end: 22 }, { start: 23, end: 44 }];

  it('exposes selected tokens as pressed and unavailable in view mode, with no tab stop', () => {
    const { group, onChange } = renderText({ disabled: true, selected: answered });

    expect(group.querySelectorAll('[tabindex]')).toHaveLength(0);
    expect(tokenButtons()).toEqual([token('The storm hit at dawn.'), token('Mara ran to the barn.')]);
    for (const el of tokenButtons()) {
      expect(el).toHaveAttribute('aria-pressed', 'true');
      expect(el).toHaveAttribute('aria-disabled', 'true');
      expect(el).not.toHaveAttribute('aria-describedby');
    }

    act(() => {
      fireEvent.keyDown(token('Mara ran to the barn.'), { key: ' ' });
      fireEvent.click(token('Mara ran to the barn.'));
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('describes each evaluated token by its marking, with no tab stop', () => {
    const { group } = renderText({ disabled: true, selected: answered, tokens: evaluated });

    expect(group.querySelectorAll('[tabindex]')).toHaveLength(0);
    expect(token('The storm hit at dawn.')).toHaveAccessibleDescription('Correct');
    expect(token('Mara ran to the barn.')).toHaveAccessibleDescription('Incorrect Selection');
    expect(token('Rain flooded the valley road.')).toHaveAccessibleDescription('Correct Answer Not Selected');
    expect(token('Rain flooded the valley road.')).toHaveAttribute('aria-pressed', 'false');
    expect(token('Rain flooded the valley road.')).toHaveAttribute('aria-disabled', 'true');
  });

  it('describes the markings in the item language', () => {
    renderText({ disabled: true, selected: answered, tokens: evaluated, language: 'es_ES' });

    expect(token('The storm hit at dawn.')).toHaveAccessibleDescription('Respuesta Correcta');
    expect(token('Mara ran to the barn.')).toHaveAccessibleDescription('Selección Incorrecta');
    expect(token('Rain flooded the valley road.')).toHaveAccessibleDescription('Respuesta Correcta No Seleccionada');
  });

  it('gives the print view no tab stop', () => {
    const { group } = renderText({ disabled: true, animationsDisabled: true });

    expect(tokenButtons()).toHaveLength(4);
    expect(group.querySelectorAll('[tabindex]')).toHaveLength(0);
  });
});
