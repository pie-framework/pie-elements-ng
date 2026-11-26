import React from 'react';
import { beforeAll, describe, it, expect, vi } from 'vitest';
import { loadLocale } from '@pie-element/shared-i18n';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// MathJax loads off a CDN and has no bearing on the announcements.
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const Root = (await import('../root')).ImageClozeAssociationComponent as React.ComponentType<Record<string, unknown>>;

const theme = createTheme();

beforeAll(() => loadLocale('es_ES'));

const base = {
  mode: 'gather',
  image: { src: 'sky.png', width: 400, height: 200, alt: 'a beach' },
  possibleResponses: ['<p>A</p>', '<p>B</p>'],
  responseContainers: [{ index: 0, x: 0, y: 0, width: '20%', height: '20%', ariaLabel: 'the sand' }],
};

const setup = (model: object = {}, session: object = { answers: [] }) => {
  const utils = render(
    <ThemeProvider theme={theme}>
      <Root model={{ ...base, ...model }} session={session} updateAnswer={vi.fn()} />
    </ThemeProvider>,
  );

  return { ...utils, region: utils.container.querySelector('[role="status"]') as HTMLElement };
};

const hiddenText = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>('div[style*="white-space: nowrap"]'))
    .filter((n) => n.getAttribute('role') !== 'status')
    .map((n) => n.textContent);

describe('single drop area, end to end by click', () => {
  it('row 7: "drop area" without "a"', () => {
    const { region } = setup();

    fireEvent.click(screen.getByRole('button', { name: 'Answer choice: A' }));
    expect(region.textContent).toBe('Selected answer choice A. Use TAB to move to drop area.');
  });

  it('row 1: the intro has neither "each" nor "up to"', () => {
    const { container } = setup();

    expect(hiddenText(container)[0]).toBe(
      'The image shows a beach. It has 1 drop area, which can hold 1 answer choice. There are 2 answer choices, which cannot be reused.',
    );
  });

  it('row 12: a second choice replaces the first and says so', async () => {
    const { region } = setup({}, { answers: [{ value: '<p>A</p>', containerIndex: 0 }] });

    fireEvent.click(screen.getByRole('button', { name: 'Answer choice: B' }));
    fireEvent.click(screen.getByRole('group', { name: 'the sand' }));
    await waitFor(() =>
      expect(region.textContent).toBe(
        'Placed answer choice B in the sand drop area. To make room for it, answer choice A was removed.',
      ),
    );
    // the replaced choice is back in the pool
    expect(screen.getByRole('button', { name: 'Answer choice: A' })).toBeInTheDocument();
  });

  it('row 14: removes a placed choice', async () => {
    const { region } = setup({}, { answers: [{ value: '<p>A</p>', containerIndex: 0 }] });

    fireEvent.click(screen.getByRole('button', { name: 'Answer choice: A in drop area the sand' }));
    fireEvent.click(screen.getByRole('group', { name: 'Choices list' }));
    await waitFor(() => expect(region.textContent).toBe('Removed answer choice A from the sand drop area.'));
  });

  it('row 3: a filled one-answer area reads on one line', () => {
    const { container } = setup({}, { answers: [{ value: '<p>A</p>', containerIndex: 0 }] });

    expect(hiddenText(container)).toContain('Drop area the sand contains answer choice A.');
  });
});

describe('announcement rules', () => {
  it('no intro outside gather mode', () => {
    expect(hiddenText(setup({ mode: 'evaluate' }).container)).toEqual([]);
    expect(hiddenText(setup({ mode: 'view' }).container)).toEqual([]);
  });

  it('no intro when the item is disabled', () => {
    expect(hiddenText(setup({ disabled: true }).container)).toEqual([]);
  });

  it('the intro reads in the item language', () => {
    const { container } = setup({ language: 'es_ES' });

    expect(hiddenText(container)[0]).not.toMatch(/^The image/);
  });

  it('reusable choices are read as reusable and stay in the pool after a placement', async () => {
    const { container, region } = setup({ duplicateResponses: true, possibleResponses: ['<p>A</p>'] });

    expect(hiddenText(container)[0]).toContain('There is 1 answer choice, which can be reused.');
    fireEvent.click(screen.getByRole('button', { name: 'Answer choice: A' }));
    fireEvent.click(screen.getByRole('button', { name: 'the sand' }));
    await waitFor(() => expect(region.textContent).toContain('Placed answer choice A in the sand drop area.'));
    expect(screen.getAllByRole('button', { name: /Answer choice: A/ }).length).toBe(2);
  });

  it('a full area announces the limit, not a placement, and keeps its answers', async () => {
    const { region } = setup(
      { maxResponsePerZone: 2, possibleResponses: ['<p>A</p>', '<p>B</p>', '<p>C</p>'] },
      { answers: [{ value: '<p>A</p>', containerIndex: 0 }, { value: '<p>B</p>', containerIndex: 0 }] },
    );

    fireEvent.click(screen.getByRole('button', { name: 'Answer choice: C' }));
    fireEvent.click(screen.getByRole('group', { name: 'the sand' }));
    await waitFor(() => expect(region.textContent).toMatch(/^You’ve reached the limit of 2 responses per area/));
    expect(region.textContent).not.toContain('Placed');
    expect(screen.getByRole('button', { name: 'Answer choice: C' })).toBeInTheDocument();
  });

  it('a full area shows the same sentence on screen as the screen reader hears', async () => {
    setup(
      { maxResponsePerZone: 2, possibleResponses: ['<p>A</p>', '<p>B</p>', '<p>C</p>'] },
      { answers: [{ value: '<p>A</p>', containerIndex: 0 }, { value: '<p>B</p>', containerIndex: 0 }] },
    );

    fireEvent.click(screen.getByRole('button', { name: 'Answer choice: C' }));
    fireEvent.click(screen.getByRole('group', { name: 'the sand' }));

    const sentence =
      'You’ve reached the limit of 2 responses per area. To add another response, one must first be removed.';
    const shown = await screen.findAllByText(sentence);

    // once in the visible warning, once in the live region
    expect(shown.some((node) => node.getAttribute('role') !== 'status')).toBe(true);
    expect(screen.queryByText('Full')).toBeNull();
  });

  it('never announces progress or completion', async () => {
    const { region } = setup({ possibleResponses: ['<p>A</p>'] });

    fireEvent.click(screen.getByRole('button', { name: 'Answer choice: A' }));
    fireEvent.click(screen.getByRole('button', { name: 'the sand' }));
    await waitFor(() => expect(region.textContent).toContain('Placed'));
    expect(region.textContent).not.toMatch(/\d+ of \d+|complete|filled/i);
  });

  it('selecting another choice announces the new selection', () => {
    const { region } = setup();

    fireEvent.click(screen.getByRole('button', { name: 'Answer choice: A' }));
    fireEvent.click(screen.getByRole('button', { name: 'Answer choice: B' }));
    expect(region.textContent).toBe('Selected answer choice B. Use TAB to move to drop area.');
  });

  it('selecting the same choice twice in a row is announced each time', () => {
    const { region } = setup();
    const tile = () => screen.getByRole('button', { name: 'Answer choice: A' });

    fireEvent.click(tile());
    fireEvent.click(tile());
    expect(region.textContent).toBe('Answer choice A is no longer selected. Use TAB to move to an answer choice.');
    fireEvent.click(tile());
    expect(region.textContent).toBe('Selected answer choice A. Use TAB to move to drop area.');
  });
});
