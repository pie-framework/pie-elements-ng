---
"@pie-element/shared-controller-utils": patch
"@pie-element/math-inline": patch
"@pie-element/math-templated": patch
---

Where the content language names a region that writes a decimal comma (`es-ES`, `de-DE`), math-inline and math-templated read a `,` or `{,}` between digits as the decimal point and `;` as the list separator. A `.` is still a decimal point. A language without a region, such as `es`, keeps the point, and so does an underscore code such as `es_ES`, which now counts as its language alone.
