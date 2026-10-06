import React from 'react';
import { afterEach, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import AnnotationMenu from '../annotation/annotation-menu';
import FreeformEditor from '../annotation/freeform-editor';

// The dark preset redefines --pie-background, --pie-text and --pie-border-dark but keeps
// --pie-white absolute.
const DARK = {
  '--pie-background': '#1a202c',
  '--pie-text': '#e2e8f0',
  '--pie-border-dark': '#9E9E9E',
  '--pie-white': '#ffffff',
};
// MUI's paper text, which the popovers keep when no theme is applied.
const PAPER_TEXT = 'rgba(0, 0, 0, 0.87)';
// The type-band rings: clear 3:1 against both annotation fills, white and the dark preset's background.
const STROKE = '#757575';
const noop = () => {};

// The rule emotion writes for one of an element's classes, before its custom properties resolve.
// Read from the style text: happy-dom's CSSOM drops a `var()` inside a shorthand.
const ruleText = (element: Element, selectorSuffix = '') =>
  [...document.querySelectorAll('style')]
    .map((style) => style.textContent ?? '')
    .filter((text) => [...element.classList].some((name) => text.startsWith(`.${name}${selectorSuffix}{`)))
    .join('\n');

// The popovers portal into document.body, so the theme is applied there, as at document scope.
const applyTheme = (vars: Record<string, string>) => {
  for (const [name, value] of Object.entries(vars)) document.body.style.setProperty(name, value);
};

afterEach(() => {
  document.body.removeAttribute('style');
});

const renderMenu = (vars: Record<string, string>) => {
  applyTheme(vars);
  render(
    <AnnotationMenu
      open
      anchorEl={document.body}
      annotations={[{ label: 'good', type: 'positive' }]}
      isNewAnnotation
      onClose={noop}
      onAnnotate={noop}
      onWrite={noop}
    />,
  );
  const menuElement = screen.getByText('Cancel').parentElement?.parentElement as HTMLElement;
  return {
    menuElement,
    menu: getComputedStyle(menuElement),
    annotation: getComputedStyle(screen.getByText('good')),
  };
};

const renderEditor = (vars: Record<string, string>, type = 'positive') => {
  applyTheme(vars);
  render(
    <FreeformEditor
      open
      anchorEl={document.body}
      offset={0}
      value="Nice choice"
      type={type}
      onClose={noop}
      onDelete={noop}
      onSave={noop}
      onTypeChange={noop}
    />,
  );
  return getComputedStyle(screen.getByText('Save').parentElement?.parentElement as HTMLElement);
};

describe('annotation menu', () => {
  it('sits on the theme background in the theme text colour', () => {
    const { menu, annotation } = renderMenu(DARK);

    expect(menu.backgroundColor).toBe('#1a202c');
    expect(menu.color).toBe('#e2e8f0');
    expect(annotation.color).toBe(PAPER_TEXT);
  });

  it('keeps the white paper and its text when no theme is applied', () => {
    const { menu } = renderMenu({});

    expect(menu.backgroundColor).toBe('#ffffff');
    expect(menu.color).toBe(PAPER_TEXT);
  });

  it('takes its outline and pointer from the theme border, falling back to the render-ui default', () => {
    const { menuElement } = renderMenu({});
    const popover = menuElement.closest('.MuiPopover-root') as Element;

    expect(ruleText(menuElement)).toContain('border:2px solid var(--pie-border-dark, #66686A)');
    expect(ruleText(popover, ' .MuiPaper-root::after')).toContain(
      'border-top-color:var(--pie-border-dark, #66686A)',
    );
  });

  it.each([
    ['the dark theme', DARK, '#9E9E9E'],
    ['no theme', {}, '#66686A'],
  ])('draws the outline in the theme border under %s', (_, vars, outline) => {
    const { menu } = renderMenu(vars);

    expect(menu.borderTopStyle).toBe('solid');
    expect(menu.borderTopWidth).toBe('2px');
    expect(menu.borderTopColor).toBe(outline);
  });
});

describe('freeform annotation editor', () => {
  it('sits on the theme background in the theme text colour', () => {
    const editor = renderEditor(DARK);

    expect(editor.backgroundColor).toBe('#1a202c');
    expect(editor.color).toBe('#e2e8f0');
  });

  it('keeps the white paper and its text when no theme is applied', () => {
    const editor = renderEditor({});

    expect(editor.backgroundColor).toBe('#ffffff');
    expect(editor.color).toBe(PAPER_TEXT);
  });

  it.each([
    ['positive', 'rgb(153, 255, 153)'],
    ['negative', 'rgb(255, 204, 238)'],
  ])('bounds the %s type colour with the stroke on both edges', (type, band) => {
    const editor = renderEditor({}, type);

    expect(editor.borderTopColor).toBe(band);
    expect(editor.borderTopWidth).toBe('4px');
    expect(editor.boxShadow).toBe(`0 0 0 1px ${STROKE}`);
    expect(editor.position).toBe('relative');
  });
});
