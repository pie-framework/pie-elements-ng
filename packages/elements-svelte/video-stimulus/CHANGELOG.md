# @pie-element/video-stimulus

## 0.1.2

### Patch Changes

- [#328](https://github.com/pie-framework/pie-elements-ng/pull/328) [`2405ee9`](https://github.com/pie-framework/pie-elements-ng/commit/2405ee9b4c97246caf8c8df342b7639fe789de5c) Thanks [@chillenious](https://github.com/chillenious)! - The extended-text-entry annotation menu has a [#757575](https://github.com/pie-framework/pie-elements-ng/issues/757575) outline and pointer, and the freeform annotation editor keeps its green or pink band between two [#757575](https://github.com/pie-framework/pie-elements-ng/issues/757575) rings, so both meet 3:1 against the annotation colours, the page and the menu in every theme. The math toolbar's Done check is a darker green (#388E3C) that meets 3:1 on the toolbar, on white and under the dark theme, and the editor toolbar's Done check takes the same green unless a host sets `--editable-html-toolbar-check`. The video transcript toggle's border takes the text colour, and with no theme applied the toggle and the video retry button now show a border in the surrounding text colour.

- [#272](https://github.com/pie-framework/pie-elements-ng/pull/272) [`5a2ad38`](https://github.com/pie-framework/pie-elements-ng/commit/5a2ad382a7e1b91be55210bb607488c01d6bb840) Thanks [@chillenious](https://github.com/chillenious)! - fix(video-stimulus): drop the assessment toolkit dependency

- [#316](https://github.com/pie-framework/pie-elements-ng/pull/316) [`c1ce388`](https://github.com/pie-framework/pie-elements-ng/commit/c1ce388d0736ba88302157936f7808783d6f0ced) Thanks [@chillenious](https://github.com/chillenious)! - fix(theming): follow the theme background on answer slots, legends and media buttons

## 0.1.1

### Patch Changes

- [#169](https://github.com/pie-framework/pie-elements-ng/pull/169) [`4ffda53`](https://github.com/pie-framework/pie-elements-ng/commit/4ffda53aa3441080a56847d43b43698ba9a8d735) Thanks [@chillenious](https://github.com/chillenious)! - Add an accessible Svelte video stimulus element with authoring, captions, transcripts, localized UI, and native timed-media discovery support, plus shared Svelte media helpers and the accepted media asset type fields.
- Updated dependencies [[`1d74cc2`](https://github.com/pie-framework/pie-elements-ng/commit/1d74cc2527432a58a73752b62e069fbf92fa0a43), [`ea07637`](https://github.com/pie-framework/pie-elements-ng/commit/ea0763784c4c84bc1b9a0ee7e04a461ff2b5ef76), [`a84b6c5`](https://github.com/pie-framework/pie-elements-ng/commit/a84b6c5e14a67655c8e5e8ec7840032ea8ef8713), [`54d6ad4`](https://github.com/pie-framework/pie-elements-ng/commit/54d6ad4b28fe9c0c9a3e7c36d856b24da0c124a0), [`a84b6c5`](https://github.com/pie-framework/pie-elements-ng/commit/a84b6c5e14a67655c8e5e8ec7840032ea8ef8713), [`53bed4b`](https://github.com/pie-framework/pie-elements-ng/commit/53bed4b0373ba756b545f45541a6af2d9430da52), [`7abcbd2`](https://github.com/pie-framework/pie-elements-ng/commit/7abcbd20a631a99df3c58158eaee953596615633), [`e3aa4f8`](https://github.com/pie-framework/pie-elements-ng/commit/e3aa4f863fddb219b58e9cdb0ababeeb84795021), [`3e49e88`](https://github.com/pie-framework/pie-elements-ng/commit/3e49e88b2768e706859eb54e1dfcb5223afe8b4c), [`4ffda53`](https://github.com/pie-framework/pie-elements-ng/commit/4ffda53aa3441080a56847d43b43698ba9a8d735)]:
  - @pie-element/shared-types@0.2.0
  - @pie-lib/delivery-events-svelte@0.2.0

## 0.1.1-next.1

### Patch Changes

- Updated dependencies [3e49e88]
  - @pie-element/shared-types@0.2.0-next.5

## 0.1.1-next.0

### Patch Changes

- 4ffda53: Add an accessible Svelte video stimulus element with authoring, captions, transcripts, localized UI, and native timed-media discovery support, plus shared Svelte media helpers and the accepted media asset type fields.
- Updated dependencies [4ffda53]
  - @pie-element/shared-types@0.2.0-next.4
