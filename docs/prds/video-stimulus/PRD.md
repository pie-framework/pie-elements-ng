# Video stimulus

Status: **Accepted** · Tier: 2 · Impl. path: New `@pie-element/video-stimulus`

Detailed facets:

- [Delivery interface](./delivery.md)
- [Authoring interface](./authoring.md)
- [Delivery HTML mockup](./wireframes/delivery.html)
- [Authoring HTML mockup](./wireframes/authoring.html)

## Context

PIE needs an accessible video passage for timed-media assessments, courses, and training workflows. The element owns media rendering, alternatives, authoring, and validation; [`pie-players`](https://github.com/pie-framework/pie-players) owns cue orchestration, playback policy, child sessions, progress persistence, completion, and TTS/media arbitration.

This PRD consumes the accepted [media asset](https://github.com/pie-framework/pie-players/blob/develop/docs/prds/shared-contracts/media-asset-contract.md) and [timed-media section](https://github.com/pie-framework/pie-players/blob/develop/docs/prds/timed-media-section-contract.md) contracts. The implementation proof is not complete when video renders in isolation: a packed element must be loaded by `pie-players`, discovered as the section time source, and reveal at least two linked questions at distinct cues.

## Goals

- Render video sources, poster, text tracks, transcript, label, and description using the shared media vocabulary.
- Give authors a previewable source/track/transcript workflow with actionable accessibility validation.
- Integrate with `MediaTimeSource` without a second timing interface, playback Session, or lifecycle-event vocabulary.
- Localize element-owned strings and consume registered `--pie-*` theme tokens.
- Prove the package-to-question architecture through a real timed-section demo and browser test.

## Non-goals

- **No cue timeline or child-item binding in this package.** Those are `TimedMediaSectionData` composition concerns.
- **No element scoring or learner response.** Watching and cue progress are section state, not a leaf-element response.
- **No upload, transcoding, storage, authorization, or signed-URL management.** The element consumes authored asset references.
- **No custom media controls in v1.** `@videojs/html` remains a future option, but v10 is currently beta and its package is too large to adopt before proving the native seam under the browser bundle budget.
- **No autoplay or automatic resume.** Playback starts only from a learner action or player command.
- **No print custom element in v1.** A video has no faithful static representation; timed-section printing owns cue-item expansion.
- **No leaf-owned custom time-source registration in v1.** The current registration event requires passage identity the leaf does not naturally own; native discovery is the ratified path.

## Proposed surface

**Model**:

- `id` / `element` — normal PIE Model identity.
- `media` — nested `MediaAssetRef` with `version: 1` and `kind: "video"`; nesting prevents collision between element and asset IDs.
- `language` — BCP 47 locale for element-owned learner UI, distinct from `media.lang`.
- `presentation` — visible label/description and initial transcript expansion.
- `accessibilityProfile` — author declarations for meaningful audio, caption provision, and whether important visuals are described.
- `uiText` — optional typed learner-string overrides; built-in English and Spanish resources provide defaults.

`@pie-element/shared-types` remains the compile-time owner of the structural media mirror and gains the accepted additive poster, duration, track, transcript, and bitrate fields. Runtime URL policy comes from the public `@pie-players/pie-assessment-toolkit` helpers; the element does not define another safe-scheme list.

**Session**: none. `SectionControllerSessionState.timedMedia` remains the sole owner of current/furthest position, reached cues, gate state, and media completion. Delivery never dispatches `session-changed` for playback.

**Modes**: `gather`, `view`, and `evaluate` use the same playable surface. `configure` is the package author export. Read-only response mode does not disable stimulus playback.

**Controller responsibilities**:

- `createDefaultModel()` returns a structurally valid source-less authoring draft; `validateDraft()` accepts missing content but rejects malformed supplied values.
- `validate()` is strict publish validation: correct version/kind, asset ID/label/language, at least one safe source, durable URLs, valid numeric metadata, complete tracks, one default track, valid transcript, and resolved accessibility declarations.
- `model()` returns a typed safe ViewModel, preserves source order, applies presentation/i18n defaults, and ignores the generic Session argument.
- `reviewAccessibility()` distinguishes blocking content obligations from recommendations software cannot verify.
- No `outcome()` or `createCorrectResponseSession()` is exported, following the non-scoring `passage` capability precedent.

**Shared Svelte media module**: reusable transcript sanitization/rendering and typed media UI messages live in `packages/lib-svelte/media-svelte`. It hides DOMPurify and transcript precedence behind a small PIE-owned interface; it does not wrap a media player or define timing events.

**Timed-media integration**: delivery renders exactly one intended `<video>` as the first/only discoverable `video, audio` descendant with `shadow: "none"`. `SectionPassageCard` finds it and attaches `createMediaElementTimeSource`, yielding native pause/seek capabilities and `time`, `seek`, `play`, `pause`, and `ended` notifications. The element emits no parallel media events and implements no cue, gate, seek-lock, restore, or TTS policy.

## Worked example

> *Prompt*: Watch the lab safety demonstration. Questions appear when the video reaches relevant steps.

The element renders local demo video, captions, and transcript in the passage selected by `TimedMediaSectionData.stimulusRef`. At cue 1, the section controller reveals a safety-equipment question. At a later required cue, it pauses through `MediaTimeSource`, reveals a handling-procedure question, and persists timed-media state. The element knows neither question identity nor completion state.

## Accessibility

WCAG 2.2 AA is the baseline; element-specific details are in the facet files.

- Meaningful synchronized audio requires captions; subtitles do not automatically count.
- Important visual information must be described in main/integrated audio in v1. A native `descriptions` text track is rendered but does not count as verified spoken audio description without browser/AT evidence.
- Transcript is strongly recommended and remains available on playback failure, but does not universally replace captions or audio description.
- Transcript content is normal navigable content, never a long `aria-describedby` value or live region.
- No autoplay, focus stealing, global character shortcuts, orientation lock, or element-owned motion.

## Architecture proof

Release evidence must cover both sides of the seam:

- `pie-elements-ng`: packed browser exports load a versioned element whose light-DOM video, tracks, transcript, authoring, and error states work without a Session.
- `pie-players`: a package-backed timed-media section has two linked question cues; real muted playback reveals them separately, reports an attached media source, and does not fall through the missing-source degradation path.

The integration uses an extracted `npm pack` artifact routed through the existing browser ESM loader. No published manifest may contain a sibling `file:` or `link:` dependency.

## Open questions

*(none at this time)*

## Status log

- Accepted for implementation after review of the Svelte package, accessibility profile, native timed-media seam, author/delivery mockups, and linked-question architecture proof.
