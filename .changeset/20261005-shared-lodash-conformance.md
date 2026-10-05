---
"@pie-element/shared-lodash": patch
---

`isEqual`, `range`, `rangeRight`, `merge`, `max` and `find` behave as in lodash 4.17. `isEqual` treats -0 as equal to 0, so graphing and graphing-solution-set score a correct answer with a -0 coordinate as correct before the session is stored as well as after. `range` and `rangeRight` coerce string arguments (a string step used to loop forever), count down when the end is below the start, repeat the start for a zero step and no longer add a value past the end through float drift. `merge` merges arrays by index, keeps a value when the source holds `undefined`, assigns class instances by reference and never writes through `__proto__`. `max` skips `NaN`, and `find` takes the `[path, value]` and partial-object shorthands and a `fromIndex`.
