// Switches multiple-choice on the current page between its two choice-naming patterns (PIE-1244),
// for screen-reader testing on a page with no Player that answers the accessibility context, such
// as pieoneer. Run it once to keep math out of choice names; run it again to go back to spoken
// names. Used as a bookmarklet: `testing.md` beside this file has the one-line form.
(() => {
  const KEY = Symbol.for('pie.accessibility');
  window.__pieMathNamesSwitch ??= { on: false, subscribers: new Set() };
  const state = window.__pieMathNamesSwitch;
  state.on = !state.on;
  const supports = state.on ? ['mathOutsideNames'] : [];

  if (!state.installed) {
    state.installed = true;
    // Capturing on the document answers before any provider further down, inside shadow roots too.
    document.addEventListener(
      'context-request',
      (event) => {
        if (event.context !== KEY || typeof event.callback !== 'function') return;
        event.stopImmediatePropagation();
        if (event.subscribe) state.subscribers.add(event.callback);
        event.callback({ supports: state.supports }, () =>
          state.subscribers.delete(event.callback)
        );
      },
      true
    );
  }
  state.supports = supports;

  // Every element that reads the context asks again, so it hears the new answer now.
  const elements = [];
  const walk = (root) => {
    for (const el of root.querySelectorAll('*')) {
      if (typeof el._subscribeAccessibility === 'function') elements.push(el);
      if (el.shadowRoot) walk(el.shadowRoot);
    }
  };
  walk(document);
  for (const el of elements) el._subscribeAccessibility();

  // A host's own math labels in a choice named from its key and note would sit in the content
  // the screen reader reads; the element's renderer removes its own, so take the rest off too.
  setTimeout(() => {
    if (!state.on) return;
    for (const el of elements) {
      for (const input of el.querySelectorAll('input[aria-labelledby]')) {
        for (const math of input.closest('label')?.querySelectorAll('mjx-container[aria-label]') ??
          []) {
          math.removeAttribute('aria-label');
        }
      }
    }
  }, 1500);

  const count = elements.length;
  const message = `${state.on ? 'Math kept out of choice names' : 'Spoken choice names (default)'}: ${count} multiple-choice element${count === 1 ? '' : 's'} switched.`;
  console.info(`[PIE-1244] ${message}`);
  alert(message);
})();
