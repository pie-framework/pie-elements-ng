import { type ReactNode, type RefObject, useLayoutEffect, useRef, useState } from 'react';
import { type MathNameOptions, mathContentName } from '@pie-element/shared-math-rendering-mathjax';

type Speak = MathNameOptions['speak'];

interface Observed {
  node: HTMLElement | null;
  observer: MutationObserver | null;
}

/**
 * The accessible name of a control whose content is math, or `undefined` when the content holds
 * none and the browser can name the control itself.
 *
 * Chrome leaves MathML out of a control's name-from-content, so a button, option or input that holds
 * only math has no name. The name is spoken from the MathML MathJax keeps beside the glyphs, and it
 * follows the content: MathJax typesets after the first render and a host can swap the markup.
 *
 * `ref` points at the element whose children hold the content. Put the result in `aria-label` on a
 * role that takes one (button, option, checkbox, radio, input) or, on a generic element, in a hidden
 * span the control references with `aria-labelledby`.
 */
export function useMathName(ref: RefObject<HTMLElement | null>, speak?: Speak): string | undefined {
  const [name, setName] = useState<string | undefined>();
  const observed = useRef<Observed>({ node: null, observer: null });
  const speaker = useRef(speak);
  speaker.current = speak;

  // The node can change between renders (a re-keyed element, a conditional branch), so every render
  // compares it with the one being watched and moves the observer only on a change.
  useLayoutEffect(() => {
    const state = observed.current;
    const node = ref.current;

    if (node === state.node) return;

    state.observer?.disconnect();
    state.observer = null;
    state.node = node;

    if (!node) {
      setName(undefined);
      return;
    }

    // Most controls hold no math, and for those the walk below has nothing to find.
    const update = () =>
      setName(node.querySelector('math') ? mathContentName(node, { speak: speaker.current }) : undefined);

    update();

    if (typeof MutationObserver === 'undefined') return;

    state.observer = new MutationObserver(update);
    state.observer.observe(node, { childList: true, subtree: true, characterData: true });
  });

  useLayoutEffect(
    () => () => {
      observed.current.observer?.disconnect();
      observed.current = { node: null, observer: null };
    },
    [],
  );

  return name;
}

interface MathNameProps {
  speak?: Speak;
  children: (name: string | undefined, ref: RefObject<HTMLElement | null>) => ReactNode;
}

/**
 * `useMathName` for a class component: the render prop receives the name and the ref to attach to
 * the element that holds the content.
 */
export function MathName({ speak, children }: MathNameProps) {
  const ref = useRef<HTMLElement | null>(null);
  const name = useMathName(ref, speak);

  return <>{children(name, ref)}</>;
}
