// A stand-in for MathLive's <math-field>, whose editor needs layout happy-dom does not have. It
// keeps what the answer fields use: the latex value, the prompts (answer blocks) and their
// values, insertion at the caret, and the asynchronous `input` event MathLive fires on an edit.
const PROMPT = /\\placeholder\[([^\]]*)\]\{([^{}]*)\}/g;

export class FakeMathfieldElement {
  constructor() {
    const el = document.createElement('math-field') as HTMLElement & Record<string, unknown>;
    const prompts = new Map<string, string>();
    let template = '';

    // MathLive makes the field itself the tab stop.
    el.setAttribute('tabindex', '0');

    const serialize = () => template.replace(PROMPT, (_m, id) => `\\placeholder[${id}]{${prompts.get(id) ?? ''}}`);
    const ids = () => [...prompts.keys()];
    const promptAt = (position: number) => ids().find((_id, i) => position >= i * 10 && position <= i * 10 + 5);
    const changed = () => setTimeout(() => el.dispatchEvent(new InputEvent('input', { bubbles: true })), 0);

    Object.defineProperty(el, 'value', {
      get: serialize,
      set(latex: string) {
        template = latex;
        prompts.clear();
        for (const [, id, value] of latex.matchAll(PROMPT)) {
          prompts.set(id, value);
        }
      },
    });
    Object.defineProperty(el, 'selection', {
      get: () => ({ ranges: [[el.position, el.position]] }),
      set(selection: { ranges: [number, number][] }) {
        el.position = selection.ranges[0][0];
      },
    });

    Object.assign(el, {
      position: -1,
      getValue: serialize,
      getPrompts: ids,
      getPromptValue: (id: string) => prompts.get(id),
      setPromptValue: (id: string, value: string) => prompts.set(id, value),
      getPromptRange: (id: string) => {
        const i = ids().indexOf(id);
        return i === -1 ? undefined : [i * 10, i * 10 + 5];
      },
      insert: (latex: string) => {
        const id = promptAt(el.position as number);
        if (id) {
          prompts.set(id, `${prompts.get(id)}${latex}`);
          changed();
        }
        return !!id;
      },
      executeCommand: () => true,
    });

    return el;
  }
}
