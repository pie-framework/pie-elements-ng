import React from 'react';
import { afterEach, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import AnnotationMenu from '../annotation/annotation-menu';
import FreeformEditor from '../annotation/freeform-editor';

// The dark preset redefines --pie-background and --pie-text but keeps --pie-white absolute.
const DARK = { '--pie-background': '#1a202c', '--pie-text': '#e2e8f0', '--pie-white': '#ffffff' };
// MUI's paper text, which the popovers keep when no theme is applied.
const PAPER_TEXT = 'rgba(0, 0, 0, 0.87)';
const noop = () => {};

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
  return {
    menu: getComputedStyle(screen.getByText('Cancel').parentElement?.parentElement as HTMLElement),
    annotation: getComputedStyle(screen.getByText('good')),
  };
};

const renderEditor = (vars: Record<string, string>) => {
  applyTheme(vars);
  render(
    <FreeformEditor
      open
      anchorEl={document.body}
      offset={0}
      value="Nice choice"
      type="positive"
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
});
