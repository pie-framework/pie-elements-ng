import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: vi.fn() }));
// The layout shows the settings panel, which holds the alert, only at a measured width.
vi.mock('@pie-lib/config-ui', async (importOriginal) => {
  const original = await importOriginal<typeof import('@pie-lib/config-ui')>();
  return {
    ...original,
    layout: {
      ...original.layout,
      ConfigLayout: ({ children, settings }: { children: React.ReactNode; settings: React.ReactNode }) => (
        <div>
          {children}
          {settings}
        </div>
      ),
    },
    AlertDialog: ({ open, text }: { open: boolean; text: string }) =>
      open ? <div role="alertdialog">{text}</div> : null,
  };
});

const { Design } = await import('../index.js');

// Three answer choices in one category, under a limit of two.
const model = (language?: string) => ({
  categories: [{ id: 'c1', label: 'Fruit' }],
  choices: [
    { id: 'a', content: 'Apple' },
    { id: 'b', content: 'Banana' },
    { id: 'c', content: 'Cherry' },
  ],
  correctResponse: [{ category: 'c1', choices: ['a', 'b', 'c'] }],
  allowMaxChoicesPerCategory: true,
  maxChoicesPerCategory: 2,
  language,
});

const renderDesign = (language?: string) =>
  render(
    <ThemeProvider theme={createTheme()}>
      <Design model={model(language)} configuration={{}} onChange={() => {}} uid="test" />
    </ThemeProvider>
  );

// A locale other than en-US loads after the first render, which shows English until then.
const expectAlert = (text: string) =>
  waitFor(() => expect(screen.getByRole('alertdialog').textContent).toBe(text));

describe('the per-category limit alert', () => {
  const ENGLISH = 'To change this value to 2, each category must have 2 or fewer answer choices.';

  it('reads English for an item that declares no language', async () => {
    renderDesign();
    await expectAlert(ENGLISH);
  });

  it('reads Spanish for an item declaring es_ES', async () => {
    renderDesign('es_ES');
    await expectAlert(
      'Para cambiar este valor a 2, cada categoría debe tener 2 o menos opciones de respuesta'
    );
  });

  it('reads English for a language categorize does not ship', async () => {
    renderDesign('de-DE');
    await expectAlert(ENGLISH);
  });
});
