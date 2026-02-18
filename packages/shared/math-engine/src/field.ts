import { normalizeLatex } from './core/latex.js';
import type {
  MathEngineCommand,
  MathEngineField,
  MathEngineHandlers,
  MathEngineSelection,
} from './types.js';
import { commandToLatex } from './commands/utils.js';

export function createField(initialLatex = '', handlers: MathEngineHandlers = {}): MathEngineField {
  let element: HTMLInputElement | null = null;
  let latex = normalizeLatex(initialLatex);

  const emitChange = (): void => {
    handlers.onChange?.(latex);
    handlers.onReflow?.();
    handlers.onScrollGuard?.();
  };

  const replaceSelection = (value: string): void => {
    if (!element) {
      latex += value;
      emitChange();
      return;
    }

    const start = element.selectionStart ?? element.value.length;
    const end = element.selectionEnd ?? start;
    const before = element.value.slice(0, start);
    const after = element.value.slice(end);
    const next = `${before}${value}${after}`;
    element.value = next;
    latex = next;
    const cursor = start + value.length;
    element.setSelectionRange(cursor, cursor);
    emitChange();
  };

  return {
    mount(hostElement: HTMLElement): void {
      if (element) {
        return;
      }

      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'pie-math-engine-input';
      input.value = latex;
      input.setAttribute('aria-label', 'Enter answer.');

      input.addEventListener('focus', () => handlers.onFocus?.());
      input.addEventListener('blur', () => handlers.onBlur?.());
      input.addEventListener('input', () => {
        latex = input.value;
        emitChange();
      });

      hostElement.innerHTML = '';
      hostElement.appendChild(input);
      element = input;
    },
    destroy(): void {
      if (element?.parentElement) {
        element.parentElement.removeChild(element);
      }
      element = null;
    },
    setLatex(value: string): void {
      const normalized = normalizeLatex(value);
      latex = normalized;
      if (element && element.value !== normalized) {
        element.value = normalized;
      }
    },
    getLatex(): string {
      return element?.value ?? latex;
    },
    clear(): void {
      this.setLatex('');
      emitChange();
    },
    focus(): void {
      element?.focus();
    },
    blur(): void {
      element?.blur();
    },
    write(value: string): string {
      replaceSelection(value);
      return this.getLatex();
    },
    command(value: MathEngineCommand): string {
      replaceSelection(commandToLatex(value));
      return this.getLatex();
    },
    keystroke(value: string): string {
      if (value === 'Backspace' && element) {
        const start = element.selectionStart ?? 0;
        const end = element.selectionEnd ?? start;

        if (start === end && start > 0) {
          element.value = `${element.value.slice(0, start - 1)}${element.value.slice(end)}`;
          element.setSelectionRange(start - 1, start - 1);
        } else {
          replaceSelection('');
          return this.getLatex();
        }
        latex = element.value;
        emitChange();
      }
      return this.getLatex();
    },
    selection(): MathEngineSelection {
      if (!element) {
        return { start: latex.length, end: latex.length };
      }
      return {
        start: element.selectionStart ?? 0,
        end: element.selectionEnd ?? 0,
      };
    },
  };
}
