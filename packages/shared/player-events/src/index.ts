/**
 * PIE Player Events
 *
 * Runtime contract for communication between delivery/author elements and host players.
 *
 * Delivery contract:
 * - `session-changed` carries metadata (`complete`, `component`).
 * - Session state is sourced from the element instance `.session`; host players may enrich
 *   forwarded events with `detail.session` snapshots for convenience.
 * - `model-set` communicates model lifecycle readiness metadata only.
 *
 * This package is the canonical source for runtime event names used by element delivery/player
 * interop (`session-changed`, `model-set`), internalized from
 * @pie-framework/pie-player-events for ESM compatibility.
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
