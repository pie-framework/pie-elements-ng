import { describe, it, expect, afterEach } from 'vitest';
import { mount, unmount, flushSync } from 'svelte';
import ChoiceRow from './ChoiceRow.svelte';

const CHOICE = { id: 'choice-a', labelHtml: '<p>Look</p>' };
const CHOICE_IMG = { id: 'choice-b', imageUrl: 'https://example.com/img.png', imageAlt: 'A cat' };

const BASE = {
  choice: CHOICE,
  instanceId: 'test',
  radioGroupName: 'test-group',
};

const mounts: Array<{ target: HTMLElement; component: ReturnType<typeof mount> }> = [];

function mountRow(props: Parameters<typeof mount<typeof ChoiceRow>>[1]['props']) {
  const target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(ChoiceRow, { target, props });
  mounts.push({ target, component });
  flushSync();
  return target;
}

afterEach(() => {
  for (const { target, component } of mounts.splice(0)) {
    unmount(component);
    target.remove();
  }
});

describe('ChoiceRow — inline layout (isHorizontal=false)', () => {
  it('renders a radio input and label for the choice', () => {
    const target = mountRow({ ...BASE });
    expect(target.querySelector('input[type="radio"]')).not.toBeNull();
    expect(target.querySelector('label')).not.toBeNull();
  });

  it('radio id and label for are paired', () => {
    const target = mountRow({ ...BASE });
    const input = target.querySelector('input[type="radio"]') as HTMLInputElement;
    const label = target.querySelector('label') as HTMLLabelElement;
    expect(input.id).toBe('test-opt-choice-a');
    expect(label.htmlFor).toBe('test-opt-choice-a');
  });

  it('radio has correct name and value', () => {
    const target = mountRow({ ...BASE });
    const input = target.querySelector('input[type="radio"]') as HTMLInputElement;
    expect(input.name).toBe('test-group');
    expect(input.value).toBe('choice-a');
  });

  it('radio is not checked when isSelected=false', () => {
    const target = mountRow({ ...BASE, isSelected: false });
    const input = target.querySelector('input[type="radio"]') as HTMLInputElement;
    expect(input.checked).toBe(false);
  });

  it('radio is checked when isSelected=true', () => {
    const target = mountRow({ ...BASE, isSelected: true });
    const input = target.querySelector('input[type="radio"]') as HTMLInputElement;
    expect(input.checked).toBe(true);
  });

  it('radio is disabled when isDisabled=true', () => {
    const target = mountRow({ ...BASE, isDisabled: true });
    const input = target.querySelector('input[type="radio"]') as HTMLInputElement;
    expect(input.disabled).toBe(true);
  });

  it('inline radio has pie-choice-radio-inline class', () => {
    const target = mountRow({ ...BASE });
    const input = target.querySelector('input[type="radio"]') as HTMLInputElement;
    expect(input.classList.contains('pie-choice-radio-inline')).toBe(true);
  });

  it('renders label html for text choice', () => {
    const target = mountRow({ ...BASE });
    expect(target.querySelector('.pie-choice-label')).not.toBeNull();
  });

  it('renders image for image choice', () => {
    const target = mountRow({ ...BASE, choice: CHOICE_IMG, choiceMode: 'image' });
    const img = target.querySelector('img.pie-choice-image') as HTMLImageElement;
    expect(img).not.toBeNull();
    expect(img.alt).toBe('A cat');
  });
});

describe('ChoiceRow — horizontal layout (isHorizontal=true)', () => {
  it('wraps radio inside label (tile layout)', () => {
    const target = mountRow({ ...BASE, isHorizontal: true });
    const label = target.querySelector('label.pie-choice-tile') as HTMLLabelElement;
    expect(label).not.toBeNull();
    expect(label.querySelector('input[type="radio"]')).not.toBeNull();
  });

  it('radio has pie-choice-radio-bottom class in horizontal mode', () => {
    const target = mountRow({ ...BASE, isHorizontal: true });
    const input = target.querySelector('input[type="radio"]') as HTMLInputElement;
    expect(input.classList.contains('pie-choice-radio-bottom')).toBe(true);
  });

  it('choice content is inside pie-choice-tile-content', () => {
    const target = mountRow({ ...BASE, isHorizontal: true });
    expect(target.querySelector('.pie-choice-tile-content')).not.toBeNull();
  });
});

describe('ChoiceRow — CSS state classes', () => {
  it('applies is-selected and pie-choice-selected when isSelected=true', () => {
    const target = mountRow({ ...BASE, isSelected: true });
    const row = target.querySelector('.pie-choice') as HTMLElement;
    expect(row.classList.contains('is-selected')).toBe(true);
    expect(row.classList.contains('pie-choice-selected')).toBe(true);
  });

  it('does not apply selected classes when isSelected=false', () => {
    const target = mountRow({ ...BASE, isSelected: false });
    const row = target.querySelector('.pie-choice') as HTMLElement;
    expect(row.classList.contains('is-selected')).toBe(false);
  });

  it('applies choice-correct and pie-choice-correct when correctness=correct', () => {
    const target = mountRow({ ...BASE, correctness: 'correct' });
    const row = target.querySelector('.pie-choice') as HTMLElement;
    expect(row.classList.contains('choice-correct')).toBe(true);
    expect(row.classList.contains('pie-choice-correct')).toBe(true);
  });

  it('applies choice-incorrect and pie-choice-incorrect when correctness=incorrect', () => {
    const target = mountRow({ ...BASE, correctness: 'incorrect' });
    const row = target.querySelector('.pie-choice') as HTMLElement;
    expect(row.classList.contains('choice-incorrect')).toBe(true);
    expect(row.classList.contains('pie-choice-incorrect')).toBe(true);
  });

  it('applies no correctness class when correctness=undefined', () => {
    const target = mountRow({ ...BASE });
    const row = target.querySelector('.pie-choice') as HTMLElement;
    expect(row.classList.contains('choice-correct')).toBe(false);
    expect(row.classList.contains('choice-incorrect')).toBe(false);
  });
});

describe('ChoiceRow — feedback badge', () => {
  it('renders no badge outside evaluate mode', () => {
    const target = mountRow({ ...BASE, isEvaluateMode: false, correctness: 'correct' });
    expect(target.querySelector('.pie-choice-feedback-badge')).toBeNull();
  });

  it('renders no badge in evaluate mode when correctness is undefined', () => {
    const target = mountRow({ ...BASE, isEvaluateMode: true, correctness: undefined });
    expect(target.querySelector('.pie-choice-feedback-badge')).toBeNull();
  });

  it('renders ✓ badge with pie-choice-feedback-correct in evaluate mode when correct', () => {
    const target = mountRow({ ...BASE, isEvaluateMode: true, correctness: 'correct' });
    const badge = target.querySelector('.pie-choice-feedback-badge') as HTMLElement;
    expect(badge).not.toBeNull();
    expect(badge.classList.contains('pie-choice-feedback-correct')).toBe(true);
    expect(badge.textContent?.trim()).toBe('✓');
  });

  it('renders ✕ badge with pie-choice-feedback-incorrect in evaluate mode when incorrect', () => {
    const target = mountRow({ ...BASE, isEvaluateMode: true, correctness: 'incorrect' });
    const badge = target.querySelector('.pie-choice-feedback-badge') as HTMLElement;
    expect(badge).not.toBeNull();
    expect(badge.classList.contains('pie-choice-feedback-incorrect')).toBe(true);
    expect(badge.textContent?.trim()).toBe('✕');
  });

  it('badge has aria-hidden=true', () => {
    const target = mountRow({ ...BASE, isEvaluateMode: true, correctness: 'correct' });
    const badge = target.querySelector('.pie-choice-feedback-badge') as HTMLElement;
    expect(badge.getAttribute('aria-hidden')).toBe('true');
  });
});
