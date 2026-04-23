# @pie-element/shared-player-events

Canonical runtime event contract for PIE element/player communication.

## Delivery events

- `session-changed`
  - `detail.complete: boolean`
  - `detail.component: string`
  - Session data should be read from the element instance `.session`.
    Host players may enrich forwarded events with `detail.session`.
- `model-set`
  - `detail.complete: boolean`
  - `detail.component: string`
  - `detail.hasModel: boolean`
  - Used for model lifecycle readiness metadata, not model mutation payloads.

## Notes

- Events bubble and are composed by default.
- Legacy `pie.*` events in `@pie-element/core` are compatibility-only and not the
  primary runtime interop contract.
