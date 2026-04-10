export { default } from './delivery/index';
import * as controllerModule from './controller/index';

// Keep runtime controller shape consistent for root package consumers.
export const controller = { ...controllerModule };
