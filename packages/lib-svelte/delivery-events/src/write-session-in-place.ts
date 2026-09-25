function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Assign a delivery update into the session object the player owns, keeping the
 * reference.
 *
 * A player hands the element a session object and reads the learner's response
 * back off that same object: `pie-player` pushes its entry into the host's own
 * `session.data` array, and `pie-item-player`'s renderer forwards the array it
 * holds rather than `element.session`. An element that only replaces its own
 * reference leaves the player's entry at its load-time value, so the forwarded
 * container compares equal to the previous one and normalizes to
 * `intent: "metadata-only"` with `session: null` - the element reports a change
 * and the response never arrives. The React elements mutate the session they
 * were given (`updateSessionValue`); this is that contract for the Svelte
 * elements, which additionally hand their component a fresh reference so
 * `$derived` reads of `props.session` still re-run.
 *
 * Keys absent from `next` are removed, so clearing a response clears it on the
 * player's object too. Anything that is not a plain object on both sides is
 * returned as the replacement it already was, and so is a frozen or sealed
 * target: writing into one throws in strict mode, which would take the
 * learner's update with it before the element ever stored it.
 */
export function writeSessionInPlace(target: unknown, next: unknown): unknown {
  if (target === next) return target;
  if (!isPlainObject(target) || !isPlainObject(next)) return next;
  if (Object.isFrozen(target) || !Object.isExtensible(target)) return next;
  try {
    for (const key of Object.keys(target)) {
      if (!(key in next)) delete target[key];
    }
    Object.assign(target, next);
  } catch {
    // A non-writable or non-configurable key on an otherwise extensible object.
    return next;
  }
  return target;
}
