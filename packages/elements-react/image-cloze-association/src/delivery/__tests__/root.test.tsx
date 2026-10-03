import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// MathJax loads off a CDN and has no bearing on the choices' names.
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

// The component declares its props through propTypes only.
const Root = (await import('../root')).ImageClozeAssociationComponent as React.ComponentType<Record<string, unknown>>;

const theme = createTheme();

const sun = '<img alt="" src="sun.png"/>';
const moon = '<img alt="" src="moon.png"/>';

const model = {
  image: { src: 'sky.png', width: 400, height: 200 },
  possibleResponses: [sun, moon, '<img alt="Saturn" src="saturn.png"/>', '<p>Mars</p>'],
  responseContainers: [{ x: 0, y: 0, width: '20%', height: '20%' }],
};

const renderRoot = (extras?: { model?: object; session?: object }) =>
  render(
    <ThemeProvider theme={theme}>
      <Root
        model={{ ...model, ...extras?.model }}
        session={extras?.session ?? { answers: [] }}
        updateAnswer={vi.fn()}
      />
    </ThemeProvider>,
  );

describe('ImageClozeAssociationComponent answer choices', () => {
  it('name a choice without a text alternative by its position', () => {
    renderRoot();

    expect(screen.getByRole('button', { name: 'Answer choice 1 of 4' }).querySelector('img')).toHaveAttribute(
      'src',
      'sun.png',
    );
    expect(screen.getByRole('button', { name: 'Answer choice 2 of 4' })).toBeInTheDocument();
  });

  it('leave a choice with text or an image alt to its content', () => {
    renderRoot();

    expect(screen.getByRole('button', { name: 'Saturn' })).not.toHaveAttribute('aria-label');
    expect(screen.getByRole('button', { name: 'Mars' })).not.toHaveAttribute('aria-label');
  });

  it('keep the position name once the choice is placed', () => {
    renderRoot({ session: { answers: [{ value: moon, containerIndex: 0 }] } });

    const area = screen.getByRole('group', { name: 'Response area 1 of 1' });
    expect(within(area).getByRole('button', { name: 'Answer choice 2 of 4' })).toBeInTheDocument();
  });

  it('name the choices in the item language', () => {
    renderRoot({ model: { language: 'es_ES' } });

    expect(screen.getByRole('button', { name: 'Opción de respuesta 1 de 4' })).toBeInTheDocument();
  });
});
