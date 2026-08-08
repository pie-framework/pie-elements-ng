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
- The legacy `pie.*` events (`pie.model_set`, `pie.session_changed`,
  `pie.model_updated`, declared in `@pie-element/shared-types`) are
  compatibility-only and not the primary runtime interop contract.
