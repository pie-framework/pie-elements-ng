---
"@pie-element/shared-controller-utils": patch
"@pie-element/math-inline": patch
"@pie-element/math-templated": patch
---

Where the content language names a region that writes a decimal comma (`es-ES`, `de-DE`), math-inline and math-templated read a number's one `,` or `{,}` as its decimal point and `;` as the list separator. A `.` is still a decimal point, and a number with two marks stays as typed. A language without a region, such as `es`, keeps the point, and so does an underscore code such as `es_ES`, which math scoring reads as its language alone. A `model.language` that names no language, `und` among them, gives way to `env.locale`.
