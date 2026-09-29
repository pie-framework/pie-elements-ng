---
"@pie-element/mc-populated-blank": patch
"@pie-lib/translator": patch
---

Lays itself out without the host's Tailwind, keeps its variant CSS to its own roots (per build, and inside a host's shadow root), and prints the answer key and teacher instructions for instructors only, with image choices printed as images. Instructors see teacher instructions in delivery, an item without a language is no longer marked as English, `lockChoiceOrder: false` shuffles the choices as in multiple-choice (`shuffle: true` still counts when `lockChoiceOrder` is unset), and `validate` honours its `config` and reports errors in multiple-choice's shape (`answerChoices`, `choices` by id, `correctResponse`). `alwaysShowCorrect` is gone: players show the key through `createCorrectResponseSession`. (PIE-1075)
