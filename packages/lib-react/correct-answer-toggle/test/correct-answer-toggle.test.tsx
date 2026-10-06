import userEvent from '@testing-library/user-event';
import React, { act, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CorrectAnswerToggle } from '../src/index';

type ToggleProps = {
  show?: boolean;
  toggled?: boolean;
  onToggle?: (toggled: boolean) => void;
  showMessage?: string;
  hideMessage?: string;
};

// The component file is untyped; this is the props contract its callers use.
const Toggle = CorrectAnswerToggle as unknown as React.ComponentType<ToggleProps>;

/** The expander shows the toggle at the end of its 300 ms transition. */
const EXPAND_MS = 300;

/** Holds `toggled` the way an element does: in its own state, updated from `onToggle`. */
function ControlledToggle({ show = true, onToggle }: { show?: boolean; onToggle: (next: boolean) => void }) {
  const [toggled, setToggled] = useState(false);
  return (
    <Toggle
      show={show}
      toggled={toggled}
      onToggle={(next) => {
        onToggle(next);
        setToggled(next);
      }}
    />
  );
}

describe('CorrectAnswerToggle', () => {
  let container: HTMLDivElement;
  let root: Root;

  function render(ui: React.ReactElement) {
    act(() => root.render(ui));
    act(() => {
      vi.advanceTimersByTime(EXPAND_MS);
    });
    return container.querySelector('button') as HTMLButtonElement;
  }

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    vi.useFakeTimers();
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.useRealTimers();
  });

  it('is a native button named by its visible label', () => {
    const button = render(<Toggle show onToggle={() => {}} />);

    expect(button.type).toBe('button');
    expect(button.textContent).toBe('Show correct answer');
    // The icons are decorative and hidden; the label must not be.
    expect(button.querySelector('[aria-hidden="true"]:not(svg)')).toBeNull();
  });

  it('reports whether the correct answer is showing through aria-pressed', () => {
    const button = render(<Toggle show toggled={false} onToggle={() => {}} />);
    expect(button.getAttribute('aria-pressed')).toBe('false');

    act(() => root.render(<Toggle show toggled onToggle={() => {}} />));
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(button.textContent).toBe('Hide correct answer');
  });

  it('takes Tab focus and switches on Enter and on Space', async () => {
    const onToggle = vi.fn();
    const button = render(<ControlledToggle onToggle={onToggle} />);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    await user.tab();
    expect(document.activeElement).toBe(button);

    await user.keyboard('{Enter}');
    expect(onToggle).toHaveBeenLastCalledWith(true);
    expect(button.getAttribute('aria-pressed')).toBe('true');

    await user.keyboard(' ');
    expect(onToggle).toHaveBeenLastCalledWith(false);
    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(onToggle).toHaveBeenCalledTimes(2);
  });

  it('switches once per click', async () => {
    const onToggle = vi.fn();
    const button = render(<ControlledToggle onToggle={onToggle} />);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    await user.click(button);
    expect(onToggle.mock.calls).toEqual([[true]]);
  });

  it('is skipped by Tab while hidden', async () => {
    render(<ControlledToggle show={false} onToggle={() => {}} />);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    await user.tab();
    expect(document.activeElement).toBe(document.body);
  });
});
