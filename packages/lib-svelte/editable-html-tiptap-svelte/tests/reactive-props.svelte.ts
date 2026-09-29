/**
 * Props a test can reassign after `mount`, the way a parent's state would change them. Lives in a
 * `.svelte.ts` module because `$state` is only available to files the Svelte compiler processes.
 */
export function reactiveProps<T extends Record<string, unknown>>(initial: T): T {
  const props = $state(initial);
  return props;
}
