import SimpleClozeComponent from './SimpleCloze.svelte';
import { defineDeliveryElement } from '@pie-lib/delivery-events-svelte';
import type { SimpleClozeQuestion, SimpleClozeSession } from '../controller/index.js';

// The demo loader and players register it with customElements.define().
const SimpleClozeElement = defineDeliveryElement<SimpleClozeQuestion, SimpleClozeSession>(
  SimpleClozeComponent,
  {
    isComplete: (_model, session) =>
      typeof session?.value === 'string' && session.value.trim().length > 0,
  }
);

export default SimpleClozeElement;
