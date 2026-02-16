/**
 * IIFE entry point for simple-cloze element.
 * Registers the delivery custom element when loaded as a script.
 */
import Element from './delivery';

if (typeof window !== 'undefined' && !customElements.get('simple-cloze-element')) {
  customElements.define('simple-cloze-element', Element as unknown as CustomElementConstructor);
}

export default Element;
