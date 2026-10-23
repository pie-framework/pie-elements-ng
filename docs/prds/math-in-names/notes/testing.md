# Comparing the two choice-naming patterns

Notes for the screen-reader comparison in [the PRD](../PRD.md). Both patterns ship in the same
multiple-choice version: spoken names are what every student gets, and the second pattern, math
kept out of names, comes on only when a Player answers the accessibility context with
`mathOutsideNames`. Nothing in production answers it, so a tester switches it on in the page.

## The version to test

The patterns are in `@pie-element/multiple-choice` from the first `next` snapshot that
`develop` publishes after PIE-1244 merges, `npm view @pie-element/multiple-choice dist-tags.next`.
Load an item with that version in pieoneer, or in the demo app (`bun run dev` in
`apps/element-demo`).

## Switching patterns

Add `&mathNames=outside` to the page's URL: in pieoneer, to the item's preview URL, for example
`…/item/E219966/playerpreview?role=instructor&mathNames=outside`; in the demo app, to a deliver
URL. Remove it to go back to spoken names. Nothing else is needed, and students never have it in
their URLs. Multiple-choice reads it from the page, and from its parent page when the item renders
in an iframe of the same site.

The parameter is temporary: it exists for this comparison and goes once it decides the default.

If adding the parameter changes nothing, the item is probably in an iframe of another site, which
the element cannot read. The bookmarklet below switches the pattern there instead: make a
bookmark whose URL is the line below, click it once on the page to keep math out of choice names,
again to go back, and again after every page load. Its readable source is
[`math-names-switch.js`](./math-names-switch.js).

```text
javascript:(()%20=>%20{%20const%20KEY%20=%20Symbol.for('pie.accessibility');%20window.__pieMathNamesSwitch%20??=%20{%20on:%20false,%20subscribers:%20new%20Map()%20};%20const%20state%20=%20window.__pieMathNamesSwitch;%20state.on%20=%20!state.on;%20state.supports%20=%20state.on%20?%20['mathOutsideNames']%20:%20[];%20const%20answer%20=%20(callback)%20=>%20callback({%20supports:%20state.supports%20},%20state.subscribers.get(callback));%20if%20(!state.installed)%20{%20state.installed%20=%20true;%20document.addEventListener(%20'context-request',%20(event)%20=>%20{%20if%20(event.context%20!==%20KEY%20||%20typeof%20event.callback%20!==%20'function')%20return;%20event.stopImmediatePropagation();%20const%20callback%20=%20event.callback;%20if%20(event.subscribe%20&&%20!state.subscribers.has(callback))%20{%20state.subscribers.set(callback,%20()%20=>%20state.subscribers.delete(callback));%20}%20answer(callback);%20},%20true%20);%20document.documentElement.dispatchEvent(%20Object.assign(new%20Event('context-provider',%20{%20bubbles:%20true,%20composed:%20true%20}),%20{%20context:%20KEY,%20contextTarget:%20document.documentElement,%20})%20);%20}%20for%20(const%20callback%20of%20state.subscribers.keys())%20answer(callback);%20const%20elements%20=%20[];%20const%20walk%20=%20(root)%20=>%20{%20for%20(const%20el%20of%20root.querySelectorAll('*'))%20{%20if%20(typeof%20el._subscribeAccessibility%20===%20'function')%20elements.push(el);%20if%20(el.shadowRoot)%20walk(el.shadowRoot);%20}%20};%20walk(document);%20if%20(state.subscribers.size%20===%200)%20for%20(const%20el%20of%20elements)%20el._subscribeAccessibility();%20setTimeout(()%20=>%20{%20if%20(!state.on)%20return;%20for%20(const%20el%20of%20elements)%20{%20for%20(const%20input%20of%20el.querySelectorAll('input[aria-labelledby]'))%20{%20for%20(const%20math%20of%20input.closest('label')?.querySelectorAll('mjx-container[aria-label]')%20??%20[])%20{%20math.removeAttribute('aria-label');%20}%20}%20}%20},%201500);%20const%20count%20=%20elements.length;%20const%20message%20=%20%60${state.on%20?%20'Math%20kept%20out%20of%20choice%20names'%20:%20'Spoken%20choice%20names%20(default)'}:%20${count}%20multiple-choice%20element${count%20===%201%20?%20''%20:%20's'}%20on%20the%20page.%60;%20console.info(%60[PIE-1244]%20${message}%60);%20alert(message);%20})();
```

The bookmarklet also removes math labels a host added inside choices that this pattern names from
their key and note, which would sit in the text read in browse mode.

## What each pattern should sound like

| | Spoken names (default) | Math kept out of names |
|---|---|---|
| Entering the group | "Answer choices, radio group" ("Part A, answer choices" in EBSR) | the same |
| Moving to choice A | "Pick the answer below, A x equals the fraction with numerator …, radio button" | "A. Pick the answer below, radio button" |
| Reading mode | the prompt, then each choice with its speech | the prompt, then each choice's key and note, then its formula as math |

In both, the prompt is read before the group, with its math.

## Matrix

- **Items**: math in the prompt only (E219966); math in the prompt and the choices
  (`c3aa9c93-6658-4c1a-ab99-e4ebd5c1c01e`); math-only choices in MathML (`ITEM-LOGIC--652583`);
  near-identical long expressions; a multiple-select item with math; an EBSR with math in both parts.
- **Players**: both renderers, ESM (MathJax 4) and IIFE (the legacy MathJax 3). ESM math is announced
  as a group and read flat in VoiceOver where legacy math reads as math, investigated separately,
  so a pattern can sound worse under ESM for that reason alone.
- **Screen readers**: VoiceOver with Safari and on iPad, JAWS with Chrome and Firefox, NVDA with
  Chrome with and without MathCAT.
- **For each**: what is heard entering the group and arrowing through the choices in forms mode;
  what is heard reading the choices in browse mode, and whether anything is heard twice; whether the
  screen reader's math explorer opens on a choice's formula; how long a student takes to tell
  near-identical choices apart; and whether a student who stays in forms mode reaches the math.
