import SimpleClozeComponent from './SimpleCloze.svelte';
import { defineDeliveryElement } from '@pie-lib/delivery-events-svelte';
import type { SimpleClozeModel, SimpleClozeSession } from '../types.js';

// The demo loader and players register it with customElements.define().
const SimpleClozeElement = defineDeliveryElement<SimpleClozeModel, SimpleClozeSession>(
  SimpleClozeComponent,
  {
    isComplete: (_model, session) =>
      typeof session?.value === 'string' && session.value.trim().length > 0,
  }
);

export default SimpleClozeElement;
