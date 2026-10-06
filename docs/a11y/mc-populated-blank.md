# MC Populated Blank A11y Coverage

## Intended Use

Students choose an answer for a populated blank in a stem, with variants that can include audio or transcript content.

## Automated Coverage

- `populated-blank-choice-labels`: choice names, stem text, keyboard reachability, and target size.
- `populated-blank-audio-transcript`: audio/transcript variant, labelled controls, media alternatives, and keyboard reachability.
- `populated-blank-stem-association`: stem reading order, choice names, and blank association.

Every variant renders the radios at 24×24 ([PIE-1171](https://illuminate.atlassian.net/browse/PIE-1171)), including `sel_r1-s3_plusggg`, whose CQT original scales them to 85%.

## Not Covered / Manual

- Confirm transcripts are complete and synchronized enough for the task.
- Confirm each blank’s relationship to the stem remains clear in screen-reader navigation.
