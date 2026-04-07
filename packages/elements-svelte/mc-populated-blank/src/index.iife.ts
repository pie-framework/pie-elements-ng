/**
 * IIFE entry for mc-populated-blank delivery custom element.
 */
import Element from './delivery';

if (typeof window !== 'undefined' && !customElements.get('mc-populated-blank-element')) {
  customElements.define(
    'mc-populated-blank-element',
    Element as unknown as CustomElementConstructor
  );
}

export default Element;
