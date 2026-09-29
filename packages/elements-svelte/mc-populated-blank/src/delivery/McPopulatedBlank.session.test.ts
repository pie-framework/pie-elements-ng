/**
 * What the component reports when the learner picks a choice, and what it
 * renders from a restored session.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import McPopulatedBlank from './McPopulatedBlank.svelte';

// A player registers the element under a versioned tag and stamps it on the
// session entry; the component must carry it through untouched.
const PLAYER_TAG = 'mc-populated-blank--version-0-3-0-next-9';

const BASE_MODEL = {
  id: '1',
  element: PLAYER_TAG,
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

const mounts: Array<{ target: HTMLElement; component: ReturnType<typeof mount> }> = [];

function mountWithSession(session: Record<string, unknown> = { id: '1', element: PLAYER_TAG }) {
  const target = document.createElement('div');
  document.body.appendChild(target);

  // Stands in for the delivery custom element, which sets this prop.
  const emitted: unknown[] = [];
  const onSessionChange = (updated: unknown) => emitted.push(updated);

  const component = mount(McPopulatedBlank as any, {
    target,
    props: { model: { ...BASE_MODEL }, session, onSessionChange },
  });
  mounts.push({ target, component });
  flushSync();
  return { target, emitted };
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
  for (const { target, component } of mounts.splice(0)) {
    unmount(component);
    target.remove();
  }
});

describe('mc-populated-blank delivery session', () => {
  it("reports the selected choice id on the player's `id` and `element`", () => {
    const { target, emitted } = mountWithSession();

    selectChoice(target, 1);

    expect(emitted).toEqual([{ id: '1', element: PLAYER_TAG, choiceId: 'b' }]);
  });

  it('adds no `id` or `element` the player did not set', () => {
    const { target, emitted } = mountWithSession({});

    selectChoice(target, 1);

    expect(emitted).toEqual([{ choiceId: 'b' }]);
  });

  it('reports a fresh object so the component re-renders', () => {
    // The wrapper writes the update into the player's session; the component
    // reads `props.session` through `$derived`, which needs a new reference.
    const session = { id: '1', element: PLAYER_TAG };
    const { target, emitted } = mountWithSession(session);

    selectChoice(target, 1);

    expect(emitted[0]).not.toBe(session);
  });

  it('renders a restored `choiceId` into the blank', () => {
    const { target } = mountWithSession({ id: '1', element: PLAYER_TAG, choiceId: 'b' });

    const checked = target.querySelector('input[type="radio"]:checked') as HTMLInputElement | null;
    expect(checked?.value).toBe('b');
  });
});
