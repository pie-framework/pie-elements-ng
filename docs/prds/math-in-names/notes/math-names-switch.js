// Switches multiple-choice on the current page between its two choice-naming patterns (PIE-1244),
// for screen-reader testing on a page with no Player that answers the accessibility context, such
// as pieoneer. Run it once to keep math out of choice names; run it again to go back to spoken
// names. Used as a bookmarklet: `testing.md` beside this file has the one-line form.
(() => {
  const KEY = Symbol.for('pie.accessibility');
  window.__pieMathNamesSwitch ??= { on: false, subscribers: new Map() };
  const state = window.__pieMathNamesSwitch;
  state.on = !state.on;
  state.supports = state.on ? ['mathOutsideNames'] : [];

  // Each subscriber keeps one unsubscribe: a consumer handed a different one calls the old one.
  const answer = (callback) =>
    callback({ supports: state.supports }, state.subscribers.get(callback));

  if (!state.installed) {
    state.installed = true;
    // Capturing on the document answers every request first, from inside shadow roots too.
    document.addEventListener(
      'context-request',
      (event) => {
        if (event.context !== KEY || typeof event.callback !== 'function') return;
        event.stopImmediatePropagation();
        const callback = event.callback;
        if (event.subscribe && !state.subscribers.has(callback)) {
          state.subscribers.set(callback, () => state.subscribers.delete(callback));
        }
        answer(callback);
      },
      true
    );
    // Announcing a provider makes the page's context root replay the requests nobody answered.
    document.documentElement.dispatchEvent(
      Object.assign(new Event('context-provider', { bubbles: true, composed: true }), {
        context: KEY,
        contextTarget: document.documentElement,
      })
    );
  }
  for (const callback of state.subscribers.keys()) answer(callback);

  // Elements another provider already answered ask again, so they hear this one.
  const elements = [];
  const walk = (root) => {
    for (const el of root.querySelectorAll('*')) {
      if (typeof el._subscribeAccessibility === 'function') elements.push(el);
      if (el.shadowRoot) walk(el.shadowRoot);
    }
  };
  walk(document);
  if (state.subscribers.size === 0) for (const el of elements) el._subscribeAccessibility();

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
  const message = `${state.on ? 'Math kept out of choice names' : 'Spoken choice names (default)'}: ${count} multiple-choice element${count === 1 ? '' : 's'} on the page.`;
  console.info(`[PIE-1244] ${message}`);
  alert(message);
})();
