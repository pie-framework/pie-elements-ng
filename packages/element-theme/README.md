# @pie-element/element-theme

Lightweight generic web-component theme wrapper for PIE players.

## Elements

- `pie-element-theme`: generic wrapper that applies `--pie-*` CSS variables.

## Attributes

- `theme`: `light | dark | auto` (default: `light`)
- `scope`: `self | document` (default: `self`)
- `variables`: JSON object of CSS variable overrides (optional)

## Usage

```html
<pie-element-theme theme="light">
  <pie-esm-element-player element-name="multiple-choice"></pie-esm-element-player>
</pie-element-theme>
```

Override one variable:

```html
<pie-element-theme
  theme="light"
  variables='{"--pie-primary":"#0d9488"}'
>
  <pie-esm-element-player element-name="hotspot"></pie-esm-element-player>
</pie-element-theme>
```
