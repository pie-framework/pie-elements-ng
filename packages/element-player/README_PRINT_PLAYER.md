# Print View In Unified Player

Use `pie-element-player` with `view="print"` for element-level print rendering.

## Example

```html
<pie-element-player
  element-name="multiple-choice"
  view="print"
  role="student"
></pie-element-player>
```

## Notes

- `role="student"` hides correct answers.
- `role="instructor"` shows answer key metadata when supported by the element.
- `model` should be assigned as a property (not as an HTML attribute).
