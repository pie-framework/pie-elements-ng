import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';

// MathJax loads off a CDN and has no bearing on the announcements.
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const { default: DragInTheBlank } = await import('../drag-in-the-blank');

// A message is said as its own node inside the live region, which empties itself shortly after.
const regionOf = (text: string | RegExp) => screen.getByText(text).closest('[role="status"]');

const props = {
  markup: 'One {{0}} two {{1}}',
  choices: [
    { id: 'a', value: 'alpha' },
    { id: 'b', value: 'beta' },
  ],
  value: {},
  language: 'en-US',
};

describe('DragInTheBlank screen reader announcements', () => {
  it('reads the intro, and the pool around the available choices', () => {
    const { container } = render(<DragInTheBlank {...props} onChange={vi.fn()} />);

    expect(container.textContent).toContain('This question has 2 blanks and 2 answer choices.');
    expect(container.textContent).toContain('2 available answer choices.');
    // The count opens the pool and the end marker closes it.
    const text = container.textContent as string;
    expect(text.indexOf('2 available answer choices.')).toBeLessThan(text.indexOf('End of available answer choices.'));
    expect(screen.getByText('End of available answer choices. Use TAB to move to an answer choice.').compareDocumentPosition(
      screen.getByRole('button', { name: 'Answer choice: beta' }),
    ) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Answer choice: alpha' })).toBeInTheDocument();
  });

  it('keeps MathJax out of the hidden text, whose math is in words already', () => {
    render(<DragInTheBlank {...props} onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Answer choice: alpha' }));

    expect(regionOf('Selected answer choice alpha. Use TAB to choose a blank.')).toHaveClass('mathjax_ignore');
    for (const text of [
      '2 available answer choices.',
      'End of available answer choices. Use TAB to move to an answer choice.',
    ]) {
      expect(screen.getByText(text)).toHaveClass('mathjax_ignore');
    }
    expect(screen.getByText(/^This question has 2 blanks/)).toHaveClass('mathjax_ignore');
  });

  it("keeps MathJax out of dnd-kit's live region and drag instructions too", () => {
    const { container } = render(<DragInTheBlank {...props} onChange={vi.fn()} />);
    const liveRegion = container.querySelector('[id^="DndLiveRegion"]');
    const tile = screen.getByRole('button', { name: 'Answer choice: alpha' });
    const instructions = container.querySelector(`[id="${tile.getAttribute('aria-describedby')}"]`);

    expect(liveRegion).toHaveAttribute('aria-live', 'assertive');
    expect(liveRegion?.closest('.mathjax_ignore')).not.toBeNull();
    expect(instructions).toHaveTextContent(/./);
    expect(instructions?.closest('.mathjax_ignore')).not.toBeNull();
  });

  it('stays quiet about what to do once the item is disabled', () => {
    const { container } = render(<DragInTheBlank {...props} disabled onChange={vi.fn()} />);

    expect(container.textContent).not.toContain('This question has');
    expect(container.textContent).not.toContain('available answer choices');
  });

  it('announces a click selection, then the placement and what is left', () => {
    const onChange = vi.fn();

    render(<DragInTheBlank {...props} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Answer choice: alpha' }));

    expect(regionOf('Selected answer choice alpha. Use TAB to choose a blank.')).toHaveAttribute('aria-live', 'polite');

    fireEvent.click(screen.getByRole('button', { name: 'Blank 2 is empty' }));

    expect(onChange).toHaveBeenCalledWith({ '1': 'a' });
    expect(regionOf(/^Placed answer choice alpha in blank 2\. 1 of 2 blanks have an answer choice\. 1 available/)).toHaveAttribute(
      'aria-live',
      'polite',
    );
  });

  it('empties its live region 100ms after each message, so no stale message is left to read', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });

    try {
      render(<DragInTheBlank {...props} onChange={vi.fn()} />);
      fireEvent.click(screen.getByRole('button', { name: 'Answer choice: alpha' }));
      const region = regionOf('Selected answer choice alpha. Use TAB to choose a blank.') as HTMLElement;

      act(() => {
        vi.advanceTimersByTime(99);
      });
      expect(region).toHaveTextContent('Selected answer choice alpha.');

      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(region.textContent).toBe('');
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('DragInTheBlank live region from one drag to the next', () => {
  // happy-dom lays nothing out, so every box is empty and a keyboard drag finds no blank to move to. Each
  // blank gets a box in a line of text, each choice tile (and the drag overlay holding one) a chip's box,
  // and the pool, with what holds it, the area below the text.
  const box = (left: number, top: number, width: number, height: number) =>
    ({ x: left, y: top, left, top, width, height, right: left + width, bottom: top + height, toJSON: () => ({}) }) as DOMRect;
  const blankBoxes: Record<string, DOMRect> = { 'Blank 1': box(100, 0, 60, 24), 'Blank 2': box(300, 0, 60, 24) };
  const poolBox = box(0, 200, 600, 300);
  const tileBox = box(10, 210, 90, 32);

  beforeEach(() => {
    // Date as well: a click within 250ms of a drag ending is the drag's own, and ignored.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      const blank = this.closest('[aria-label^="Blank "]')?.getAttribute('aria-label') ?? '';
      const named = Object.keys(blankBoxes).find((name) => blank.startsWith(name));

      if (named) return blankBoxes[named];
      if (this.closest('[aria-label^="Answer choice:"]')) return tileBox;

      return this.matches('.board') || this.querySelector('.board') ? poolBox : tileBox;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  const tick = (ms: number) =>
    act(() => {
      vi.advanceTimersByTime(ms);
    });

  // dnd-kit listens on the document once a drag is live, and only from the tick after it starts.
  const press = (code: string, key = code) => {
    act(() => {
      fireEvent.keyDown(document.activeElement as HTMLElement, { code, key });
    });
    tick(10);
  };

  // The session follows each placement, as the element's host makes it do.
  function Item() {
    const [value, setValue] = React.useState({});

    return <DragInTheBlank {...props} value={value} onChange={setValue} />;
  }

  // The element's own (polite) live region empties itself 100ms after each message, so what it said is
  // read from the nodes added to it.
  const setup = () => {
    const view = render(<Item />);
    const region = view.container.querySelector('[role="status"][aria-live="polite"]') as HTMLElement;
    const observer = new MutationObserver(() => {});
    observer.observe(region, { childList: true, subtree: true });
    const said = () =>
      observer
        .takeRecords()
        .flatMap((record) => [...record.addedNodes])
        .map((node) => node.textContent ?? '')
        .filter(Boolean);
    // The first choice tile left in the pool, not the drag overlay's copy of one.
    const poolTile = (name?: string) =>
      view.container.querySelector(`.board [aria-label${name ? `="Answer choice: ${name}"` : '^="Answer choice:"'}]`) as HTMLElement;

    return { region, said, poolTile };
  };

  it('says what each keyboard drag placed, not only the first', () => {
    const { region, said, poolTile } = setup();
    const results: string[][] = [];

    for (const round of [1, 2, 3]) {
      const choice = poolTile().getAttribute('aria-label')?.replace('Answer choice: ', '');

      poolTile().focus();
      press('Space', ' ');
      press('Tab');
      press('Space', ' ');
      results.push(said());
      tick(400);

      expect(region.textContent, `round ${round}`).toBe('');
      expect(results.at(-1), `round ${round}`).toEqual([expect.stringMatching(new RegExp(`^Placed answer choice ${choice} in blank 1\\.`))]);
    }

    expect(results).toHaveLength(3);
  });

  it('says a click selection made after a keyboard drag was cancelled', () => {
    const { said, poolTile } = setup();

    fireEvent.click(poolTile('alpha'));
    expect(said()).toEqual(['Selected answer choice alpha. Use TAB to choose a blank.']);
    tick(400);

    poolTile('beta').focus();
    press('Space', ' ');
    press('Escape');
    tick(400);
    // The cancel itself is the drag's to say, in the drag provider's region.
    said();

    fireEvent.click(poolTile('alpha'));
    expect(said()).toEqual(['Selected answer choice alpha. Use TAB to choose a blank.']);
    tick(400);

    fireEvent.click(screen.getByRole('button', { name: 'Blank 1 is empty' }));
    expect(said()).toEqual([expect.stringMatching(/^Placed answer choice alpha in blank 1\./)]);
  });
});
