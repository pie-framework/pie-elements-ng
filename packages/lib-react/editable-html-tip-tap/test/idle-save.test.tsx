import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render } from '@testing-library/react';

// MathJax loads off a CDN and has no bearing on saving.
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const { EditableHtml } = await import('../src/components/EditableHtml');

const mountEditor = async (props: Record<string, unknown> = {}) => {
  let instance: any;
  render(
    <EditableHtml
      markup=""
      onChange={vi.fn()}
      activePlugins={[]}
      editorRef={(e: any) => (instance = e || instance)}
      {...props}
    />
  );
  await vi.waitFor(() => expect(instance).toBeTruthy());
  return instance;
};

describe('EditableHtml idle save', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls onDone once the user stops typing for idleSaveDelay ms', async () => {
    const onDone = vi.fn();
    const editor = await mountEditor({ onDone, idleSaveDelay: 500 });
    vi.useFakeTimers();

    act(() => {
      editor.commands.insertContent('Hello');
    });
    vi.advanceTimersByTime(400);
    act(() => {
      editor.commands.insertContent(' world');
    });
    vi.advanceTimersByTime(400);
    expect(onDone).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(onDone.mock.calls[0][0]).toContain('Hello world');
  });

  it('saves on blur only when idleSaveDelay is not passed', async () => {
    const onDone = vi.fn();
    const editor = await mountEditor({ onDone });
    vi.useFakeTimers();

    act(() => {
      editor.commands.insertContent('Hello');
    });
    vi.advanceTimersByTime(60000);
    expect(onDone).not.toHaveBeenCalled();
  });
});
