/**
 * What the component reports when the learner picks a choice, and what it
 * renders from a restored session.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import McPopulatedBlank from './McPopulatedBlank.svelte';

const BASE_MODEL = {
  id: '1',
  element: 'mc-populated-blank',
  template: '<p>{{blank}}</p>',
  choiceMode: 'text',
  choices: [
    { id: 'a', labelHtml: 'louk' },
    { id: 'b', labelHtml: 'look' },
  ],
  correctChoiceId: 'b',
  interactionMode: 'populate_blank',
  sentenceHtml: '',
  layoutProfile: '',
  mode: 'gather',
};

type DeliveryHost = HTMLDivElement & {
  session?: unknown;
  onSessionChange?: (session: unknown) => void;
};

const mounts: Array<{ host: HTMLElement; component: ReturnType<typeof mount> }> = [];

function mountWithHost(
  session: Record<string, unknown> = { id: '1', element: 'mc-populated-blank' }
) {
  // Stands in for the delivery custom element: `forwardSessionChange` walks up
  // from the clicked input to the nearest node exposing `onSessionChange`.
  const host = document.createElement('div') as DeliveryHost;
  const target = document.createElement('div');
  host.appendChild(target);
  document.body.appendChild(host);

  const emitted: unknown[] = [];
  host.session = session;
  host.onSessionChange = (updated: unknown) => emitted.push(updated);

  const component = mount(McPopulatedBlank as any, {
    target,
    props: { model: { ...BASE_MODEL }, session },
  });
  mounts.push({ host, component });
  flushSync();
  return { host, target, emitted };
}

function selectChoice(target: HTMLElement, index: number) {
  const inputs = Array.from(target.querySelectorAll('input[type="radio"]')) as HTMLInputElement[];
  const input = inputs[index];
  input.checked = true;
  input.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
  return input;
}

afterEach(() => {
  for (const { host, component } of mounts.splice(0)) {
    unmount(component);
    host.remove();
  }
});

describe('mc-populated-blank delivery session', () => {
  it('reports the selected choice id', () => {
    const { target, emitted } = mountWithHost();

    selectChoice(target, 1);

    expect(emitted).toHaveLength(1);
    expect(emitted[0]).toMatchObject({
      id: '1',
      element: 'mc-populated-blank',
      choiceId: 'b',
    });
  });

  it('hands the host a fresh object so the component re-renders', () => {
    // The wrapper writes the update into the player's session; the component
    // reads `props.session` through `$derived`, which needs a new reference.
    const session = { id: '1', element: 'mc-populated-blank' };
    const { target, emitted } = mountWithHost(session);

    selectChoice(target, 1);

    expect(emitted[0]).not.toBe(session);
  });

  it('renders a restored `choiceId` into the blank', () => {
    const { target } = mountWithHost({
      id: '1',
      element: 'mc-populated-blank',
      choiceId: 'b',
    });

    const checked = target.querySelector('input[type="radio"]:checked') as HTMLInputElement | null;
    expect(checked?.value).toBe('b');
  });
});
