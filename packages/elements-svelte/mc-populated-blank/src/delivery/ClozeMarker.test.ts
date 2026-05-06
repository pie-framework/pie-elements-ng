import { describe, it, expect, afterEach } from 'vitest';
import { mount, unmount, flushSync } from 'svelte';
import ClozeMarker from './ClozeMarker.svelte';

const BASE = {
  blankWidth: '8rem',
  blankBorderWidth: '2px',
  ariaLabel: 'Selected answer',
};

const mounts: Array<{ target: HTMLElement; component: ReturnType<typeof mount> }> = [];

function mountSlot(props: Parameters<typeof mount<typeof ClozeMarker>>[1]['props']) {
  const target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(ClozeMarker, { target, props });
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

describe('ClozeMarker — ARIA contract', () => {
  it('renders a span with role=status', () => {
    const target = mountSlot({ ...BASE });
    const span = target.querySelector('.pie-blank-slot') as HTMLElement;
    expect(span.getAttribute('role')).toBe('status');
  });

  it('has aria-live=polite and aria-atomic=true', () => {
    const target = mountSlot({ ...BASE });
    const span = target.querySelector('.pie-blank-slot') as HTMLElement;
    expect(span.getAttribute('aria-live')).toBe('polite');
    expect(span.getAttribute('aria-atomic')).toBe('true');
  });

  it('forwards ariaLabel to aria-label', () => {
    const target = mountSlot({ ...BASE, ariaLabel: 'Your answer' });
    const span = target.querySelector('.pie-blank-slot') as HTMLElement;
    expect(span.getAttribute('aria-label')).toBe('Your answer');
  });
});

describe('ClozeMarker — layout props', () => {
  it('applies blankWidth and blankBorderWidth as inline styles', () => {
    const target = mountSlot({ ...BASE, blankWidth: '10rem', blankBorderWidth: '4px' });
    const span = target.querySelector('.pie-blank-slot') as HTMLElement;
    expect(span.style.width).toBe('10rem');
    expect(span.style.borderBottomWidth).toBe('4px');
  });

  it('applies standalone classes when isStandalone=true', () => {
    const target = mountSlot({ ...BASE, isStandalone: true });
    const span = target.querySelector('.pie-blank-slot') as HTMLElement;
    expect(span.classList.contains('cloze-marker-standalone')).toBe(true);
    expect(span.classList.contains('pie-blank-slot-standalone')).toBe(true);
  });

  it('does not apply standalone classes when isStandalone=false', () => {
    const target = mountSlot({ ...BASE, isStandalone: false });
    const span = target.querySelector('.pie-blank-slot') as HTMLElement;
    expect(span.classList.contains('cloze-marker-standalone')).toBe(false);
  });
});

describe('ClozeMarker — content modes', () => {
  it('renders empty placeholder when no choice is set', () => {
    const target = mountSlot({ ...BASE });
    expect(target.querySelector('.cloze-marker-empty')).not.toBeNull();
    expect(target.querySelector('.pie-blank-value')).toBeNull();
    expect(target.querySelector('img')).toBeNull();
  });

  it('renders text value when displayChoiceLabelHtml is set', () => {
    const target = mountSlot({ ...BASE, displayChoiceLabelHtml: '<p>Look</p>' });
    expect(target.querySelector('.pie-blank-value')).not.toBeNull();
    expect(target.querySelector('.cloze-marker-empty')).toBeNull();
  });

  it('renders image when choiceMode=image and displayChoice has imageUrl', () => {
    const target = mountSlot({
      ...BASE,
      choiceMode: 'image',
      displayChoice: { imageUrl: 'https://example.com/cat.png', imageAlt: 'A cat' },
    });
    const img = target.querySelector('img.pie-blank-image') as HTMLImageElement;
    expect(img).not.toBeNull();
    expect(img.alt).toBe('A cat');
    expect(target.querySelector('.cloze-marker-empty')).toBeNull();
  });

  it('falls back to empty placeholder when choiceMode=image but imageUrl is missing', () => {
    const target = mountSlot({
      ...BASE,
      choiceMode: 'image',
      displayChoice: { imageUrl: undefined },
    });
    expect(target.querySelector('.cloze-marker-empty')).not.toBeNull();
    expect(target.querySelector('img')).toBeNull();
  });

  it('uses fallback alt text when imageAlt is not provided', () => {
    const target = mountSlot({
      ...BASE,
      choiceMode: 'image',
      displayChoice: { imageUrl: 'https://example.com/img.png' },
    });
    const img = target.querySelector('img') as HTMLImageElement;
    expect(img.alt).toBe('Selected answer image');
  });

  it('prefers image over text when both choiceMode=image and displayChoiceLabelHtml are set', () => {
    const target = mountSlot({
      ...BASE,
      choiceMode: 'image',
      displayChoice: { imageUrl: 'https://example.com/img.png', imageAlt: 'Cat' },
      displayChoiceLabelHtml: '<p>Look</p>',
    });
    expect(target.querySelector('img')).not.toBeNull();
    expect(target.querySelector('.pie-blank-value')).toBeNull();
  });
});
