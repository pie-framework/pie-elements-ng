/**
 * Web Component Test Helpers
 *
 * Utilities for testing PIE Web Components.
 */

import type { PieModel, PieSession } from '@pie-elements-ng/shared-types';
import { assignProps } from '@pie-elements-ng/shared-utils';

/**
 * Create a test container for web components
 */
export function createTestContainer(): HTMLElement {
  const container = document.createElement('div');
  container.id = `test-container-${Date.now()}`;
  document.body.appendChild(container);
  return container;
}

/**
 * Clean up a test container
 */
export function cleanupTestContainer(container: HTMLElement): void {
  container.remove();
}

/**
 * Wait for a web component to be defined
 */
export async function waitForComponentDefined(tagName: string, timeout = 5000): Promise<void> {
  const startTime = Date.now();
  while (!customElements.get(tagName)) {
    if (Date.now() - startTime > timeout) {
      throw new Error(`Component ${tagName} was not defined within ${timeout}ms`);
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

/**
 * Create and mount a web component
 */
export async function mountComponent<T extends HTMLElement>(
  tagName: string,
  props?: {
    model?: PieModel;
    session?: PieSession;
    [key: string]: unknown;
  }
): Promise<T> {
  await waitForComponentDefined(tagName);

  const container = createTestContainer();
  const element = document.createElement(tagName) as T;

  if (props) {
    assignProps(element, props);
  }

  container.appendChild(element);
  return element;
}

/**
 * Wait for an event to be dispatched
 */
export function waitForEvent<T = unknown>(
  element: HTMLElement,
  eventName: string,
  timeout = 5000
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      element.removeEventListener(eventName, handler);
      reject(new Error(`Event ${eventName} was not dispatched within ${timeout}ms`));
    }, timeout);

    const handler = (event: Event) => {
      clearTimeout(timeoutId);
      element.removeEventListener(eventName, handler);
      resolve((event as CustomEvent<T>).detail);
    };

    element.addEventListener(eventName, handler);
  });
}

/**
 * Simulate user input on an element
 */
export function simulateInput(
  element: HTMLInputElement | HTMLTextAreaElement,
  value: string
): void {
  element.value = value;
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

/**
 * Simulate a click on an element
 */
export function simulateClick(element: HTMLElement): void {
  element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
}

/**
 * Simulate keyboard event
 */
export function simulateKeyboard(
  element: HTMLElement,
  key: string,
  eventType: 'keydown' | 'keyup' | 'keypress' = 'keydown'
): void {
  element.dispatchEvent(
    new KeyboardEvent(eventType, {
      key,
      bubbles: true,
      cancelable: true,
    })
  );
}

/**
 * Query selector with type safety
 */
export function querySelector<T extends HTMLElement>(
  container: HTMLElement | Document,
  selector: string
): T | null {
  return container.querySelector<T>(selector);
}

/**
 * Query selector all with type safety
 */
export function querySelectorAll<T extends HTMLElement>(
  container: HTMLElement | Document,
  selector: string
): T[] {
  return Array.from(container.querySelectorAll<T>(selector));
}
