# 08 — Image-based variant additions

Type: **HITL**

## What to build

Identify Learnosity items in the `1JQLtMp0itQcxfSQ` org that use image-based choices (as opposed to text choices). Add corresponding entries to `mc-populated-blank.json` with `sourceReference` fields pointing to those items. These entries unlock parity testing for the image-choice rendering path, which current text-only variants do not exercise.

Use `scripts/fetch-learnosity-item.mjs` to inspect candidate items and verify they map correctly to McPopulatedBlank's model shape (image URL, image alt, correct choice ID).

## Acceptance criteria

- [ ] At least one image-based choice variant entry added to `mc-populated-blank.json` with a valid `sourceReference`.
- [ ] The new entry renders correctly on the existing deliver route (`/mc-populated-blank/deliver?demo=<id>`).
- [ ] The new entry renders correctly on the parity route (`/mc-populated-blank/parity?demo=<id>`) once issues 01–02 are complete.
- [ ] Image alt text from the Learnosity item is mapped to the PIE model's `imageAlt` field.

## Blocked by

None — can start immediately (parallel track; parity spec coverage depends on issues 01–06 being complete first).

## Items to use for parity testing
|item type|text (en)|text (es)|graphic (en)|graphic (es)|
|-|-|-|-|-|
|sel-r1-gg_plusggg|0d42ee84-b291-4336-b689-6912199fa81f|ea363a8b-26a1-44fb-bc8b-85f42758d952|bc827dec-cb5e-4f09-b7f0-e227c2912c2f|na|
|sel-r1-g_plusggg|0060b039-2605-47a6-8305-96e0463fcfd0|8e2e031c-5594-4081-811b-ddfcbecd5667|e6dc4fe3-076d-4d39-963a-f5742987801a|na|
|sel-r1-_plusggg|000eb0e6-92a0-43cd-bb1f-89ddb52da2e5|25bdc860-bd49-438d-a597-78561422037b|097f87c5-c474-4dda-97b2-46b30d598a54|a83f1d87-f3e5-4c0e-8eb4-408275336c0b|
|sel-r1-_gplusggg|11b4d9be-a79e-48c3-9e58-84f5be3dbb0f|74a235ac-ba03-462d-9e78-077603f7f51e|a0c05ca1-127d-49eb-bb05-8ea7b5c1834f|na|
|sel-r1-_ggplusggg|0291a767-2334-4742-a899-e4178e85fc02|23e2b004-9b64-41cb-b620-c108146d5a27|2e53a942-8ceb-46d4-bf56-ddd7b376f504|00cd1143-ceda-4f81-8f1f-6c9555d043e4|
|sel-r1-s3plusggg|003dcbf8-ff38-4930-84ee-26ca8be834b9|5f9fcfe0-5870-4e1b-a436-49dceb43759d|c3b6c877-444d-4d27-9f1a-3cbc8af38b7a|na|
|sel_vic|04973d1a-0557-4963-937d-7ac76ee3baeb|9264f1c0-a6c9-4920-bb9c-7590be3c172a|na|na|
|sr_vic|00293f60-334f-48d0-b145-f7cb9f02a0fe|na|na|na|