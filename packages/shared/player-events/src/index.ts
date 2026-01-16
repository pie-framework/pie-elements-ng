/**
 * PIE Player Events
 *
 * Custom events for PIE player communication between elements and the player.
 * Internalized from @pie-framework/pie-player-events for ESM compatibility.
 */

export type ModelSetDetail = {
  complete: boolean;
  component: any;
  hasModel: boolean;
};

export class ModelSetEvent extends CustomEvent<ModelSetDetail> {
  static TYPE = 'model-set';

  constructor(
    readonly component: string,
    readonly complete: boolean,
    hasModel: boolean
  ) {
    super(ModelSetEvent.TYPE, {
      bubbles: true,
      composed: true,
      detail: { complete, component, hasModel },
    });
  }
}

export type DeleteDone = (e?: Error) => void;

export type SessionChangedDetail = {
  complete: boolean;
  component: any;
};

export class SessionChangedEvent extends CustomEvent<SessionChangedDetail> {
  static TYPE = 'session-changed';

  constructor(readonly component: string, readonly complete: boolean) {
    super(SessionChangedEvent.TYPE, {
      bubbles: true,
      composed: true,
      detail: { complete, component },
    });
  }
}
