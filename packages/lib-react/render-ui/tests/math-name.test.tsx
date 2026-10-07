/**
 * A control that holds math is named from the MathML MathJax keeps beside the glyphs, and the name
 * follows the content as it is typeset or replaced.
 */
import { afterEach, describe, expect, it } from 'vitest';
import React, { useRef } from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot, type Root } from 'react-dom/client';
import { MathName, useMathName } from '../src/math-name';

let root: Root | undefined;
let host: HTMLElement | undefined;

// Content changes reach the hook through a MutationObserver, whose callback runs in a microtask.
async function render(element: React.ReactElement) {
  if (!host) {
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
  }
  await act(async () => {
    root?.render(element);
    await Promise.resolve();
  });
}

const button = () => host?.querySelector('button') as HTMLButtonElement;
const label = () => button().getAttribute('aria-label');

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = undefined;
  host = undefined;
});

const typeset = (mathml: string) =>
  `<mjx-container><mjx-math aria-hidden="true">glyphs</mjx-math><mjx-assistive-mml>${mathml}</mjx-assistive-mml></mjx-container>`;

const HALF = '<math><mfrac><mn>1</mn><mn>2</mn></mfrac></math>';
const SQUARE = '<math><msup><mi>x</mi><mn>2</mn></msup></math>';

const Tile = ({ html }: { html: string }) => {
  const content = useRef<HTMLDivElement>(null);
  const name = useMathName(content);

  return (
    <button type="button" aria-label={name}>
      <div ref={content} data-testid="content" dangerouslySetInnerHTML={{ __html: html }} />
    </button>
  );
};

describe('useMathName', () => {
  it('names a control from the math it holds', async () => {
    await render(<Tile html={typeset(HALF)} />);

    expect(label()).toBe('1 half');
  });

  it('leaves a control without math to the browser', async () => {
    await render(<Tile html="<p>Antigone</p>" />);

    expect(label()).toBeNull();
  });

  it('renames the control when typesetting adds the math afterwards', async () => {
    await render(<Tile html="<span>\(x^2\)</span>" />);
    expect(label()).toBeNull();

    await act(async () => {
      (host?.querySelector('[data-testid="content"]') as HTMLElement).innerHTML = typeset(SQUARE);
      await Promise.resolve();
    });

    expect(label()).toBe('x squared');
  });

  it('renames the control when the content is replaced', async () => {
    await render(<Tile html={typeset(HALF)} />);
    await render(<Tile html={typeset(SQUARE)} />);

    expect(label()).toBe('x squared');
  });

  it('drops the name when the math goes', async () => {
    await render(<Tile html={typeset(HALF)} />);
    await render(<Tile html="<p>Antigone</p>" />);

    expect(label()).toBeNull();
  });
});

describe('MathName', () => {
  it('hands a class component the name and the ref', async () => {
    await render(
      <MathName>
        {(name, ref) => (
          <button type="button" aria-label={name}>
            <span ref={ref} dangerouslySetInnerHTML={{ __html: typeset(HALF) }} />
          </button>
        )}
      </MathName>
    );

    expect(label()).toBe('1 half');
  });

  it('speaks with a host speaker when given one', async () => {
    await render(
      <MathName speak={() => 'one half, as the host says it'}>
        {(name, ref) => (
          <button type="button" aria-label={name}>
            <span ref={ref} dangerouslySetInnerHTML={{ __html: typeset(HALF) }} />
          </button>
        )}
      </MathName>
    );

    expect(label()).toBe('one half, as the host says it');
  });
});
