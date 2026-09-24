---
"@pie-element/simple-cloze": patch
"@pie-lib/translator": patch
---

The session stores the answer as `value`, as the React elements do, where it was `response`; hosts that read it must switch. Answers now compare as plain text, so an answer key authored as HTML matches what the learner types; an unanswered response can be revealed in evaluate mode; the prompt renders math; and `model-set` reports a restored answer as complete. Instructors see teacher instructions, collapsed in delivery and printed, including when `teacherInstructionsEnabled` is unset (PIE-1075).
