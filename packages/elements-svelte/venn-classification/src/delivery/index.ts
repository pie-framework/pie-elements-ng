import VennClassificationComponent from './VennClassification.svelte';
import { isComplete } from '../controller/index.js';
import { defineDeliveryElement } from '@pie-lib/delivery-events-svelte';
import type { VennClassificationModel, VennClassificationSession } from '../types.js';

const VennClassificationElement = defineDeliveryElement<
  VennClassificationModel,
  VennClassificationSession
>(VennClassificationComponent, { isComplete });

export default VennClassificationElement;
