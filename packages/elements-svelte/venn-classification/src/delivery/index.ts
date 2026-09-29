import VennClassificationComponent from './VennClassification.svelte';
import { isComplete } from '../controller/index.js';
import { defineDeliveryElement } from '@pie-lib/delivery-events-svelte';
import type { VennModel, VennSession } from '../types.js';

const VennClassificationElement = defineDeliveryElement<VennModel, VennSession>(
  VennClassificationComponent,
  { isComplete }
);

export default VennClassificationElement;
