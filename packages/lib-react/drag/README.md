# @pie-lib/drag

Drag-and-drop building blocks on `@dnd-kit/core`: `DragProvider`, the accessible draggable and drop-target hooks, `swap`, `uid`, and the placeholders (`PlaceHolder`, `DraggableChoice` and the element-specific droppables), which predate the hooks.

## Accessible draggables and drop targets

`useDraggableControl` and `useDropTarget` decide role, tab stop and accessible name. A call site spreads the props they return and never spreads dnd-kit's `attributes` itself: those carry `role="button"` and a tab stop even while dragging is disabled.

### `useDraggableControl`

```tsx
const { setNodeRef, controlProps, transform, isDragging } = useDraggableControl({ id, data, disabled, label });

return (
  <div ref={setNodeRef} {...controlProps}>
    {content}
  </div>
);
```

| Option | Meaning |
| --- | --- |
| `id`, `data` | As for dnd-kit's `useDraggable`. |
| `disabled` | Dragging is off. |
| `label` | The accessible name. |
| `labelledBy` | Id of the element whose text names the control; wins over `label`. |
| `contentName` | `(node) => string \| undefined`, naming the control from its rendered content. |

It returns everything `useDraggable` does except `attributes` and `listeners`, plus `controlProps`.

- **Enabled**, `controlProps` makes the element one tab stop: `role="button"`, `tabIndex={0}`, `aria-roledescription="draggable"`, `aria-describedby` pointing at the `DndContext` drag instructions, `aria-pressed` while dragging, the sensors' listeners, and the name.
- **Disabled**, `controlProps` is empty and the element is plain content: a generic element may not carry a name, and a native control keeps its own role, tab stop and name.
- Spread `controlProps` on exactly one element, with no focusable descendants: a button's children are presentational to assistive technology. A control that is itself a native button, such as a graphing tool, takes `controlProps` on the `<button>` and `setNodeRef` on the button or a wrapper.

The name resolves in this order: `labelledBy`, `label`, `contentName`, then the browser's name from content, which `role="button"` allows. Generated names come from `@pie-lib/translator` under the element's own namespace, for example "Response area 1 of 3".

`contentName` receives the node given to `setNodeRef` after every render and returns the name, or `undefined` to leave it to the browser. It is the place for content the browser cannot name well, such as math. It runs on React renders only, so content that changes outside React, such as MathJax typesetting after mount, is not seen until the next render.

### `useDropTarget`

```tsx
const { setNodeRef, targetProps, isOver } = useDropTarget({ id, data, label, onPlace: hasSelection ? place : undefined });

return <div ref={setNodeRef} onClick={place} {...targetProps} />;
```

| Option | Meaning |
| --- | --- |
| `id`, `data` | As for dnd-kit's `useDroppable`. |
| `disabled` | Drops are off, and the target is no tab stop. |
| `label`, `labelledBy` | The accessible name, as for `useDraggableControl`. |
| `onPlace` | Places the current selection here. Given, the target is a tab stop that calls it on Enter or Space. |
| `holdsChoices` | The target renders draggable choices inside it. |

It returns everything `useDroppable` does, plus `targetProps`:

| State | `role` | `tabIndex` | Enter, Space |
| --- | --- | --- | --- |
| No `onPlace`, or disabled | `group` | `-1` | — |
| `onPlace`, no `holdsChoices` | `button` | `0` | `onPlace` |
| `onPlace` and `holdsChoices` | `group` | `0` | `onPlace` |

- `tabIndex={-1}` keeps focus on a target whose role changes under it: a keyboard placement fills an empty target, which turns the focused button into a group.
- Only a keydown on the target itself places. A choice inside the target, or one being dragged by keyboard (dnd-kit keeps focus on it while the drag moves), would otherwise place on its own Enter or Space.
- Pointer activation stays with the caller, because a click on a filled target means different things in different elements.

### Drop zones that hold choices

A zone that holds any number of choices, such as a categorize category ([#278](https://github.com/pie-framework/pie-elements-ng/pull/278)), is a group named by its visible label (`labelledBy`) and a tab stop that places the current selection (`onPlace` with `holdsChoices`). Each choice inside it is its own `useDraggableControl` with its own tab stop. A button would make those choices presentational.

A zone that holds one choice, such as a blank or a response area, is a button while it is empty and can take the selection, and a group once filled, when the choice inside it is the tab stop: pass `onPlace` only while the zone is empty.

A draggable that is also the drop target for its siblings, such as a tool in a reorderable toolbar, keeps a bare `useDroppable` on the same node: the draggable carries the name, and a group around it would only add an unnamed container.
