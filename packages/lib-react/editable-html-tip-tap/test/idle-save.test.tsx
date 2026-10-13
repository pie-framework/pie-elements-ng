import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render } from '@testing-library/react';

// MathJax loads off a CDN and has no bearing on saving.
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const { EditableHtml } = await import('../src/components/EditableHtml');

const mountEditor = async (props: Record<string, unknown> = {}) => {
  let instance: any;
  const element = (extra: Record<string, unknown> = {}) => (
    <EditableHtml
      markup=""
      onChange={vi.fn()}
      activePlugins={[]}
      editorRef={(e: any) => (instance = e || instance)}
      {...props}
      {...extra}
    />
  );
  const view = render(element());
  await vi.waitFor(() => expect(instance).toBeTruthy());
  return {
    editor: instance,
    rerender: (extra: Record<string, unknown>) => view.rerender(element(extra)),
    unmount: view.unmount,
  };
};

const type = (editor: any, text: string) =>
  act(() => {
    editor.commands.insertContent(text);
  });

describe('EditableHtml idle save', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls onDone once the user stops typing for idleSaveDelay ms', async () => {
    const onDone = vi.fn();
    const { editor } = await mountEditor({ onDone, idleSaveDelay: 500 });
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
    const { editor } = await mountEditor({ onDone });
    vi.useFakeTimers();

    act(() => {
      editor.commands.insertContent('Hello');
    });
    vi.advanceTimersByTime(60000);
    expect(onDone).not.toHaveBeenCalled();
  });

  it('sends a pending save when the editor is unmounted before the delay runs out', async () => {
    const onChange = vi.fn();
    const onDone = vi.fn();
    const { editor, unmount } = await mountEditor({ onChange, onDone, idleSaveDelay: 500 });
    vi.useFakeTimers();

    type(editor, 'Hello');
    unmount();

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0]).toContain('Hello');
    expect(onDone).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1000);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('waits while a toolbar is open, as a blur does', async () => {
    const onDone = vi.fn();
    const { editor } = await mountEditor({ onDone, idleSaveDelay: 500 });
    vi.useFakeTimers();

    editor._toolbarOpened = true;
    type(editor, 'Hello');
    vi.advanceTimersByTime(1500);
    expect(onDone).not.toHaveBeenCalled();

    editor._toolbarOpened = false;
    vi.advanceTimersByTime(500);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('waits for a composition to end', async () => {
    const onDone = vi.fn();
    const { editor } = await mountEditor({ onDone, idleSaveDelay: 500 });
    vi.useFakeTimers();

    let composing = true;
    Object.defineProperty(editor.view, 'composing', { configurable: true, get: () => composing });
    type(editor, 'Hello');
    vi.advanceTimersByTime(1500);
    expect(onDone).not.toHaveBeenCalled();

    composing = false;
    vi.advanceTimersByTime(500);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('keeps typing that follows a save when the caller passes the save back', async () => {
    const onChange = vi.fn();
    const { editor, rerender } = await mountEditor({ onChange, idleSaveDelay: 500 });
    vi.useFakeTimers();

    type(editor, 'abc');
    vi.advanceTimersByTime(500);
    const saved = onChange.mock.calls[0][0];
    type(editor, 'd');
    const cursor = editor.state.selection.from;

    rerender({ markup: saved });

    expect(editor.getText()).toBe('abcd');
    expect(editor.state.selection.from).toBe(cursor);
  });

  it('keeps the blocks of a multi-line save when the caller passes it back', async () => {
    const onChange = vi.fn();
    const { editor, rerender } = await mountEditor({ onChange, idleSaveDelay: 500 });
    vi.useFakeTimers();
    act(() => {
      editor.commands.setContent('<div>A</div><div>B</div>');
    });

    type(editor, '!');
    vi.advanceTimersByTime(500);
    const saved = onChange.mock.calls[0][0];
    const cursor = editor.state.selection.from;

    rerender({ markup: saved });

    expect(editor.getHTML()).toBe(saved);
    expect(editor.state.selection.from).toBe(cursor);
  });

  it('still takes markup that the editor did not send', async () => {
    const { editor, rerender } = await mountEditor({ idleSaveDelay: 500 });

    rerender({ markup: '<div>from the host</div>' });

    expect(editor.getText()).toBe('from the host');
  });
});
