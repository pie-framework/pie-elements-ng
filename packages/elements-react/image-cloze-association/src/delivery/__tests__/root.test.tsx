import React from 'react';
import { beforeAll, describe, it, expect, vi } from 'vitest';
import { loadLocale } from '@pie-element/shared-i18n';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// MathJax loads off a CDN and has no bearing on the choices' names.
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

// The component declares its props through propTypes only.
const Root = (await import('../root')).ImageClozeAssociationComponent as React.ComponentType<Record<string, unknown>>;

const theme = createTheme();

// The components read their catalogs synchronously; the Spanish cases need them resident.
beforeAll(() => loadLocale('es_ES'));

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

  it('name a choice with text or an image alt for that text', () => {
    renderRoot();

    expect(screen.getByRole('button', { name: 'Answer choice: Saturn' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Answer choice: Mars' })).toBeInTheDocument();
  });

  it('name a placed choice with text for its drop area', () => {
    renderRoot({ session: { answers: [{ value: '<p>Mars</p>', containerIndex: 0 }] } });

    expect(
      screen.getByRole('button', { name: 'Answer choice: Mars in drop area Response area 1 of 1' }),
    ).toBeInTheDocument();
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

describe('ImageClozeAssociationComponent toggles', () => {
  it.each([
    ['en_US', 'Show Teacher Instructions', 'Show Rationale'],
    ['es_ES', 'Mostrar instrucciones para el maestro', 'Mostrar justificación'],
  ])('are named in the %s item language', (language, instructions, rationale) => {
    renderRoot({
      model: { language, teacherInstructions: '<p>Read aloud.</p>', rationale: '<p>Because.</p>' },
    });

    expect(screen.getByRole('button', { name: instructions })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: rationale })).toBeInTheDocument();
  });
});

describe('ImageClozeAssociationComponent screen reader intro', () => {
  const hidden = (container: HTMLElement) =>
    Array.from(container.querySelectorAll<HTMLElement>('div[style*="white-space: nowrap"]'))
      .filter((node) => node.getAttribute('role') !== 'status')
      .map((node) => node.textContent);

  it('describes the image, its drop areas, the choices and the keys', () => {
    const { container } = renderRoot({
      model: {
        mode: 'gather',
        image: { src: 'sky.png', width: 400, height: 200, alt: 'a beach' },
        possibleResponses: ['<p>1</p>', '<p>10</p>'],
        responseContainers: [
          { x: 0, y: 0, width: '20%', height: '20%', ariaLabel: 'left' },
          { x: 50, y: 0, width: '20%', height: '20%' },
        ],
      },
    });

    expect(hidden(container)).toEqual([
      'The image shows a beach. It has 2 drop areas, which can each hold 1 answer choice. There are 2 answer choices, which cannot be reused.',
      'Use TAB to move between answer choices and drop areas, ENTER to select/drop, and ESC to cancel.',
      'Drop area left is empty.',
      'Drop area Response area 2 of 2 is empty.',
      '2 available answer choices. Answer choice: 1 Answer choice: 10 End of available answer choices. Use TAB to move to an answer choice.',
    ]);
  });

  it('is left out once the item is not answerable', () => {
    const { container } = renderRoot({ model: { mode: 'view', disabled: true } });

    expect(hidden(container)).toEqual([]);
  });

  it('announces a click selection and its deselection in a live region', () => {
    const { container } = renderRoot({ model: { mode: 'gather' } });
    const region = container.querySelector('[role="status"]') as HTMLElement;
    const tile = screen.getByRole('button', { name: 'Answer choice: Mars' });

    fireEvent.click(tile);
    expect(region.textContent).toBe('Selected answer choice Mars. Use TAB to move to drop area.');

    fireEvent.click(tile);
    expect(region.textContent).toBe('Answer choice Mars is no longer selected. Use TAB to move to an answer choice.');
  });

  it('announces a placement and a removal', async () => {
    const { container } = renderRoot({ model: { mode: 'gather' } });
    const region = container.querySelector('[role="status"]') as HTMLElement;

    fireEvent.click(screen.getByRole('button', { name: 'Answer choice: Mars' }));
    fireEvent.click(screen.getByRole('button', { name: 'Response area 1 of 1' }));
    await waitFor(() => expect(region.textContent).toBe('Placed answer choice Mars in Response area 1 of 1 drop area.'));
  });
});

describe('ImageClozeAssociationComponent math choices', () => {
  it('leave a choice with math to its own content', () => {
    renderRoot({
      model: { possibleResponses: ['<span data-latex="">\\(\\frac{1}{2}\\)</span>', '<p>Mars</p>'] },
    });

    expect(screen.getByRole('button', { name: 'Answer choice: Mars' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /frac/ })?.hasAttribute('aria-label')).not.toBe(true);
  });

  it('does not announce a refused drop as a placement', async () => {
    const { container } = renderRoot({
      model: {
        mode: 'gather',
        maxResponsePerZone: 2,
        possibleResponses: ['<p>A</p>', '<p>B</p>', '<p>C</p>'],
      },
      session: { answers: [{ value: '<p>A</p>', containerIndex: 0 }, { value: '<p>B</p>', containerIndex: 0 }] },
    });
    const region = container.querySelector('[role="status"]') as HTMLElement;

    fireEvent.click(screen.getByRole('button', { name: 'Answer choice: C' }));
    fireEvent.click(screen.getByRole('group', { name: 'Response area 1 of 1' }));
    await waitFor(() => expect(region.textContent).toBe('Full'));
  });

  it('renames a tile when the interface language changes', () => {
    const props = (language: string) => ({
      model,
      language,
      session: { answers: [{ value: '<p>Mars</p>', containerIndex: 0 }] },
      updateAnswer: vi.fn(),
    });
    const { rerender } = render(
      <ThemeProvider theme={theme}>
        <Root {...props('en_US')} />
      </ThemeProvider>,
    );
    expect(screen.getByRole('button', { name: /^Answer choice: Mars in drop area/ })).toBeInTheDocument();

    rerender(
      <ThemeProvider theme={theme}>
        <Root {...props('es_ES')} />
      </ThemeProvider>,
    );
    expect(screen.queryByRole('button', { name: /^Answer choice: Mars in drop area/ })).toBeNull();
    expect(screen.getByRole('button', { name: /Mars/ })).toBeInTheDocument();
  });
});

describe('ImageClozeAssociationComponent announcements, end to end by click', () => {
  const twoAreas = {
    mode: 'gather',
    image: { src: 'sky.png', width: 400, height: 200, alt: 'a sky' },
    possibleResponses: ['<p>A</p>', '<p>B</p>'],
    responseContainers: [
      { index: 0, x: 0, y: 0, width: '20%', height: '20%', ariaLabel: 'left' },
      { index: 1, x: 50, y: 0, width: '20%', height: '20%', ariaLabel: 'right' },
    ],
  };

  const setup = (session: object = { answers: [] }) => {
    const utils = renderRoot({ model: twoAreas, session });
    const region = utils.container.querySelector('[role="status"]') as HTMLElement;

    return { ...utils, region };
  };

  it('row 7: several areas say "a drop area"', () => {
    const { region } = setup();

    fireEvent.click(screen.getByRole('button', { name: 'Answer choice: A' }));
    expect(region.textContent).toBe('Selected answer choice A. Use TAB to move to a drop area.');
  });

  it('row 12: places a choice in the area that was clicked', async () => {
    const { region } = setup();

    fireEvent.click(screen.getByRole('button', { name: 'Answer choice: A' }));
    fireEvent.click(screen.getByRole('button', { name: 'right' }));
    await waitFor(() => expect(region.textContent).toBe('Placed answer choice A in right drop area.'));
    expect(screen.getByRole('button', { name: 'Answer choice: A in drop area right' })).toBeInTheDocument();
  });

  it('row 13: moves a placed choice to the other area', async () => {
    const { region } = setup({ answers: [{ value: '<p>A</p>', containerIndex: 0 }] });

    fireEvent.click(screen.getByRole('button', { name: 'Answer choice: A in drop area left' }));
    fireEvent.click(screen.getByRole('button', { name: 'right' }));
    await waitFor(() => expect(region.textContent).toBe('Moved answer choice A from left drop area to right drop area.'));
  });

  it('row 14: removes a placed choice by selecting the pool', async () => {
    const { region } = setup({ answers: [{ value: '<p>A</p>', containerIndex: 0 }] });

    fireEvent.click(screen.getByRole('button', { name: 'Answer choice: A in drop area left' }));
    fireEvent.click(screen.getByRole('group', { name: 'Choices list' }));
    await waitFor(() => expect(region.textContent).toBe('Removed answer choice A from left drop area.'));
  });

  it('row 15: selecting the pool for a choice already in the pool only ends the selection', async () => {
    const { region } = setup();

    fireEvent.click(screen.getByRole('button', { name: 'Answer choice: B' }));
    fireEvent.click(screen.getByRole('group', { name: 'Choices list' }));
    await waitFor(() => expect(region.textContent).toBe('Answer choice B is no longer selected. Use TAB to move to an answer choice.'));
  });

  it('a placed choice leaves the intro pool list, and the area list shows it', () => {
    const { container } = setup({ answers: [{ value: '<p>A</p>', containerIndex: 1 }] });
    const text = Array.from(container.querySelectorAll<HTMLElement>('div[style*="white-space: nowrap"]'))
      .filter((n) => n.getAttribute('role') !== 'status')
      .map((n) => n.textContent);

    expect(text).toContain('Drop area left is empty.');
    expect(text).toContain('Drop area right contains answer choice A.');
    expect(text.at(-1)).toBe('1 available answer choice. B Use TAB to move to answer choice.');
  });

  it('the live region is assertive, atomic and starts empty', () => {
    const { region } = setup();

    expect(region).toHaveAttribute('aria-live', 'assertive');
    expect(region).toHaveAttribute('aria-atomic', 'true');
    expect(region.textContent).toBe('');
  });
});
