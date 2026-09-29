# Video stimulus — authoring

Authoring facet of [the video stimulus PRD](./PRD.md).

## Layout

The authoring surface uses immutable Model updates through `onChange` and `model.updated`. At wide widths it presents a resizable editor/preview split; at narrow widths it becomes one column with preview after the editor. Preview embeds real delivery in `view` mode and owns no Session.

## Editor sections

**Basics**: asset ID, visible label, optional description, media-content language, learner UI language, label/description visibility, and initial transcript expansion. The label remains the accessible name when visually hidden.

**Video sources**: add/remove/reorder URL, MIME type, and optional dimensions/bitrate. At least one safe source is required for publish; order is preserved. `blob:` may preview but is never a durable published source. Preview loads only after commit/explicit action, not on each keystroke.

**Poster**: optional safe URL with preview. It is never presented as a substitute for media alternatives.

**Text tracks**: add/remove/reorder URL, kind, language, label, and default state. Only one default track. Author guidance distinguishes captions from subtitles and notes that native description-track presence does not prove spoken audio description.

**Transcript**: plain text, inline rich text, or external URL. Delivery sanitizes inline HTML and excludes scripts, event handlers, forms, iframes, embedded media, and unsafe links. External content is linked rather than fetched.

**Accessibility review**: authors declare whether audio is meaningful, how captions are provided, and whether meaningful visuals are described in main/integrated audio. Manual review covers caption timing/accuracy, speakers, meaningful sounds, and audio-description completeness.

## Validation

Blocking findings include unsafe/missing publish sources, missing asset ID/label/language, malformed tracks, meaningful audio without captions, captions-track claims without a valid captions track, meaningful visuals not described, and unresolved declarations.

Warnings include no transcript, subtitles without captions, generic labels, unreviewed automatic captions, external-only transcript, and unsupported/likely non-durable encodings.

Errors are associated with exact controls/rows and summarized with links. Errors and warnings use icon plus text, not color alone. Validation runs on blur and explicit review/publish attempts, not assertively on each keystroke. Browser/network/codec preview failures remain separate from structural validation.

`validateDraft()` permits missing author content while rejecting unsafe or malformed supplied values. `validate()` remains strict publish validation; no persistent `draft` escape hatch exists in the Model.

## Author accessibility, theming, and i18n

All controls are native labelled form controls. Source and track ordering has keyboard buttons rather than a drag-only path. The split handle is keyboard adjustable and neither pane depends on it.

Author chrome consumes registered `--pie-*` tokens and exposes no author-selected raw colors. Author strings resolve from a typed catalog using a non-persisted author locale; learner preview uses the Model learner language.
