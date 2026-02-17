import { describe, expect, it, vi } from 'vitest';
import { createField } from '../src/field';

describe('createField invariants', () => {
  it('normalizes latex slashes in setLatex', () => {
    const field = createField('');
    field.setLatex('\\\\frac');
    expect(field.getLatex()).toBe('\\frac');
  });

  it('triggers reflow and scroll guards on edits', () => {
    const onReflow = vi.fn();
    const onScrollGuard = vi.fn();

    const field = createField('', { onReflow, onScrollGuard });
    field.write('x');

    expect(onReflow).toHaveBeenCalled();
    expect(onScrollGuard).toHaveBeenCalled();
  });
});
