/**
 * PIE Web Component events
 */

// Dispatched when model is set on student view
export class ModelSetEvent extends Event {
  constructor(
    public model: unknown,
    eventInitDict?: EventInit
  ) {
    super('pie.model_set', eventInitDict);
  }
}

// Dispatched when student changes response
export class SessionChangedEvent extends Event {
  constructor(
    public session: unknown,
    eventInitDict?: EventInit
  ) {
    super('pie.session_changed', eventInitDict);
  }
}

// Dispatched when author updates configuration
export class ModelUpdatedEvent extends Event {
  constructor(
    public model: unknown,
    public reset = false,
    eventInitDict?: EventInit
  ) {
    super('pie.model_updated', eventInitDict);
  }
}

// Type guard for PIE events
export function isPieEvent(
  event: Event
): event is ModelSetEvent | SessionChangedEvent | ModelUpdatedEvent {
  return event.type.startsWith('pie.');
}
