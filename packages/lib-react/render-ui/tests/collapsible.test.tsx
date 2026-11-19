/**
 * The Collapsible header is a disclosure button: it is a native button, so it takes a tab
 * stop and Enter and Space, and it exposes its state and the panel it controls.
 */
import { loadLocale } from '@pie-element/shared-i18n';
import { afterEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const { Collapsible } = await import('../src/collapsible/index');

const LABELS = { hidden: 'Show Rationale', visible: 'Hide Rationale' };

let root: Root | undefined;
let host: HTMLElement | undefined;

function render(element: React.ReactElement) {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root?.render(element));
  return host;
}

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = undefined;
  host = undefined;
});

describe('Collapsible', () => {
  it('renders the header as a collapsed button that controls the panel', () => {
    const container = render(
      <Collapsible labels={LABELS}>
        <p>Because.</p>
      </Collapsible>
    );
    const toggle = container.querySelector('button') as HTMLButtonElement;

    expect(toggle.type).toBe('button');
    expect(toggle.textContent).toBe('Show Rationale');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');

    const panel = document.getElementById(toggle.getAttribute('aria-controls') ?? '');
    expect(panel).not.toBeNull();
    expect(container.contains(panel)).toBe(true);
    expect(panel?.textContent).toBe('');
  });

  it('expands and collapses on activation', () => {
    const container = render(
      <Collapsible labels={LABELS}>
        <p>Because.</p>
      </Collapsible>
    );
    const toggle = container.querySelector('button') as HTMLButtonElement;
    const panel = document.getElementById(toggle.getAttribute('aria-controls') ?? '');

    act(() => toggle.click());
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(toggle.textContent).toBe('Hide Rationale');
    expect(panel?.textContent).toBe('Because.');

    act(() => toggle.click());
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(toggle.textContent).toBe('Show Rationale');
  });

  it.each([
    ['en_US', 'Show', 'Hide'],
    ['es_ES', 'Mostrar', 'Ocultar'],
    [undefined, 'Show', 'Hide'],
  ])('defaults the labels to the %s item language', async (language, show, hide) => {
    const container = render(
      <Collapsible language={language}>
        <p>Because.</p>
      </Collapsible>
    );
    const toggle = container.querySelector('button') as HTMLButtonElement;
    // Nothing preloads here, as in an element that never calls loadLocale: the component
    // loads its own catalog and re-renders.
    await act(() => loadLocale(language));

    expect(toggle.textContent).toBe(show);
    act(() => toggle.click());
    expect(toggle.textContent).toBe(hide);
  });

  it.each([
    ['teacherInstructions', 'en_US', 'Show Teacher Instructions', 'Hide Teacher Instructions'],
    ['teacherInstructions', 'es_ES', 'Mostrar instrucciones para el maestro', 'Ocultar instrucciones para el maestro'],
    ['rationale', undefined, 'Show Rationale', 'Hide Rationale'],
    ['rationale', 'es-MX', 'Mostrar justificación', 'Ocultar justificación'],
  ])('labels the %s variant in the %s language', async (variant, language, show, hide) => {
    const container = render(
      <Collapsible variant={variant} language={language}>
        <p>Because.</p>
      </Collapsible>
    );
    const toggle = container.querySelector('button') as HTMLButtonElement;
    await act(() => loadLocale(language));

    expect(toggle.textContent).toBe(show);
    act(() => toggle.click());
    expect(toggle.textContent).toBe(hide);
  });

  it('relabels the variant when the language changes after the first render', async () => {
    const container = render(
      <Collapsible variant="teacherInstructions" language="en-US">
        <p>Because.</p>
      </Collapsible>
    );
    const toggle = container.querySelector('button') as HTMLButtonElement;
    expect(toggle.textContent).toBe('Show Teacher Instructions');

    act(() =>
      root?.render(
        <Collapsible variant="teacherInstructions" language="es">
          <p>Because.</p>
        </Collapsible>
      )
    );
    await act(() => loadLocale('es'));

    expect(toggle.textContent).toBe('Mostrar instrucciones para el maestro');
  });

  it('lets explicit labels win over the variant, each on its own', async () => {
    const container = render(
      <Collapsible variant="rationale" language="es" labels={{ hidden: 'Why?' }}>
        <p>Because.</p>
      </Collapsible>
    );
    const toggle = container.querySelector('button') as HTMLButtonElement;
    await act(() => loadLocale('es'));

    expect(toggle.textContent).toBe('Why?');
    act(() => toggle.click());
    expect(toggle.textContent).toBe('Ocultar justificación');
  });

  it('gives each instance its own panel id', () => {
    const container = render(
      <div>
        <Collapsible labels={LABELS}>
          <p>One.</p>
        </Collapsible>
        <Collapsible labels={LABELS}>
          <p>Two.</p>
        </Collapsible>
      </div>
    );
    const ids = [...container.querySelectorAll('button')].map((b) => b.getAttribute('aria-controls'));

    expect(ids).toHaveLength(2);
    expect(ids[0]).not.toBe(ids[1]);
  });
});
