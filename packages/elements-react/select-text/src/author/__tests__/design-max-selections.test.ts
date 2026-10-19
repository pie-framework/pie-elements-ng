import { describe, expect, it, vi } from 'vitest';

vi.mock('@pie-lib/text-select', () => ({ Tokenizer: () => null }));
vi.mock('@pie-lib/editable-html-tip-tap', () => ({ default: () => null }));
vi.mock('@pie-lib/config-ui', () => ({
  InputContainer: () => null,
  NumberTextField: () => null,
  FeedbackConfig: () => null,
  settings: { Panel: () => null, toggle: () => null, radio: () => null },
  layout: { ConfigLayout: () => null },
}));

const { Design } = await import('../design.js');

const tokens = [
  { text: 'a', start: 0, end: 1, correct: true },
  { text: 'b', start: 2, end: 3 },
  { text: 'c', start: 4, end: 5, correct: true },
];

const make = (selectionCountSettings: boolean, model: Record<string, unknown>) => {
  const onModelChanged = vi.fn();
  const design = new (Design as any)({
    model: { text: 'a b c', tokens, maxSelections: 0, ...model },
    configuration: { selectionCount: { settings: selectionCountSettings } },
    onModelChanged,
  });
  return { design, onModelChanged };
};

describe('select-text author maxSelections', () => {
  it('follows the correct answer count when the control is hidden', () => {
    const { design, onModelChanged } = make(false, {});
    design.changeTokens([...tokens, { text: 'd', start: 6, end: 7, correct: true }], 'word');
    expect(onModelChanged.mock.calls[0][0].maxSelections).toBe(3);
  });

  it('shrinks when correct tokens are removed and the control is hidden', () => {
    const { design, onModelChanged } = make(false, { maxSelections: 5 });
    design.changeTokens(tokens.map((t) => ({ ...t, correct: false })), 'word');
    expect(onModelChanged.mock.calls[0][0].maxSelections).toBe(0);
  });

  it('keeps a larger author-chosen value when the control is visible', () => {
    const { design, onModelChanged } = make(true, { maxSelections: 5 });
    design.changeTokens(tokens, 'word');
    expect(onModelChanged.mock.calls[0][0].maxSelections).toBe(5);
  });

  it('corrects a stale larger value on mount when hidden', () => {
    const { design, onModelChanged } = make(false, { maxSelections: 3 });
    design.componentDidMount();
    expect(onModelChanged).toHaveBeenCalledTimes(1);
    expect(onModelChanged.mock.calls[0][0].maxSelections).toBe(2);
  });

  it('does nothing on mount when already in sync or visible', () => {
    const a = make(false, { maxSelections: 2 });
    a.design.componentDidMount();
    const b = make(true, { maxSelections: 3 });
    b.design.componentDidMount();
    expect(a.onModelChanged).not.toHaveBeenCalled();
    expect(b.onModelChanged).not.toHaveBeenCalled();
  });
});
