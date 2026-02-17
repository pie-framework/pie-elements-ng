import { composeStaticLatex, parseStaticLatex } from './core/parser';
import type { StaticFieldHandle, StaticToken } from './types';
import { commandToLatex } from './commands/utils';

type StaticHandlers = {
  onFieldChange?: (fieldId: string, value: string) => void;
  onFieldFocus?: (fieldId: string) => void;
  onFieldBlur?: (fieldId: string) => void;
  onReflow?: () => void;
};

type StaticInstance = {
  mount: (element: HTMLElement) => void;
  destroy: () => void;
  setLatex: (latex: string) => void;
  getLatex: () => string;
  getFieldById: (id: string) => StaticFieldHandle | undefined;
  getFields: () => StaticFieldHandle[];
};

const KEYSTROKE_BACKSPACE = 'Backspace';

export function createStatic(initialLatex = '', handlers: StaticHandlers = {}): StaticInstance {
  let host: HTMLElement | null = null;
  let tokens = parseStaticLatex(initialLatex);
  let fieldElements = new Map<string, HTMLInputElement>();

  const rebuild = (): void => {
    if (!host) {
      return;
    }

    host.innerHTML = '';
    fieldElements = new Map<string, HTMLInputElement>();

    tokens.forEach((token) => {
      if (token.type === 'text') {
        const span = document.createElement('span');
        span.className = 'pie-math-engine-static-text';
        span.textContent = token.value;
        host?.appendChild(span);
        return;
      }

      const wrapper = document.createElement('span');
      wrapper.className = 'pie-math-engine-static-field';
      wrapper.setAttribute('mathquill-block-id', token.id.replace('r', ''));

      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'pie-math-engine-static-field-input';
      input.value = token.value;
      input.dataset.fieldId = token.id;
      input.setAttribute('aria-label', 'Enter answer.');

      input.addEventListener('focus', () => handlers.onFieldFocus?.(token.id));
      input.addEventListener('blur', () => handlers.onFieldBlur?.(token.id));
      input.addEventListener('input', () => {
        const nextValue = input.value;
        tokens = tokens.map((entry) =>
          entry.type === 'field' && entry.id === token.id ? { ...entry, value: nextValue } : entry
        );
        handlers.onFieldChange?.(token.id, nextValue);
      });

      wrapper.appendChild(input);
      host?.appendChild(wrapper);
      fieldElements.set(token.id, input);
    });
  };

  const getFieldHandle = (token: Extract<StaticToken, { type: 'field' }>): StaticFieldHandle => {
    const withElement = (fn: (input: HTMLInputElement) => void): void => {
      const input = fieldElements.get(token.id);
      if (!input) {
        return;
      }
      fn(input);
    };

    const updateValue = (nextValue: string): void => {
      tokens = tokens.map((entry) =>
        entry.type === 'field' && entry.id === token.id ? { ...entry, value: nextValue } : entry
      );
      withElement((input) => {
        if (input.value !== nextValue) {
          input.value = nextValue;
        }
      });
      handlers.onFieldChange?.(token.id, nextValue);
      handlers.onReflow?.();
    };

    const getCurrentLatex = (): string => {
      const current = tokens.find((entry) => entry.type === 'field' && entry.id === token.id);
      return current?.type === 'field' ? current.value : '';
    };

    return {
      id: Number.parseInt(token.id.replace('r', ''), 10),
      latex: getCurrentLatex,
      write: (value) => {
        const next = `${getCurrentLatex()}${value}`;
        updateValue(next);
      },
      cmd: (value) => {
        const writeValue = commandToLatex(value);
        const next = `${getCurrentLatex()}${writeValue}`;
        updateValue(next);
      },
      keystroke: (value) => {
        if (value !== KEYSTROKE_BACKSPACE) {
          return;
        }
        const current = getCurrentLatex();
        updateValue(current.slice(0, -1));
      },
      clear: () => updateValue(''),
      focus: () => withElement((input) => input.focus()),
      blur: () => withElement((input) => input.blur()),
      el: () => fieldElements.get(token.id) ?? null,
    };
  };

  return {
    mount(element: HTMLElement): void {
      host = element;
      rebuild();
    },
    destroy(): void {
      if (host) {
        host.innerHTML = '';
      }
      host = null;
      fieldElements = new Map<string, HTMLInputElement>();
    },
    setLatex(latex: string): void {
      tokens = parseStaticLatex(latex);
      rebuild();
    },
    getLatex(): string {
      return composeStaticLatex(tokens);
    },
    getFieldById(id: string): StaticFieldHandle | undefined {
      const token = tokens.find((entry) => entry.type === 'field' && entry.id === id);
      if (!token || token.type !== 'field') {
        return undefined;
      }
      return getFieldHandle(token);
    },
    getFields(): StaticFieldHandle[] {
      return tokens
        .filter((entry): entry is Extract<StaticToken, { type: 'field' }> => entry.type === 'field')
        .map(getFieldHandle);
    },
  };
}
