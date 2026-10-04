export type RenderOutcome = 'rendered' | 'not-rendered';

export type RenderWatchOptions = {
  /** How long the element's DOM must stay unchanged, once it has content, to count as rendered. */
  quietMs?: number;
  /** Upper bound on the wait. At the bound, an element with content counts as rendered. */
  timeoutMs?: number;
};

export const RENDER_QUIET_MS = 250;
export const RENDER_TIMEOUT_MS = 15_000;

/** Nodes a scan has something to inspect in, even without text. */
const SCANNABLE_NODES =
  'img, svg, canvas, video, audio, iframe, input, select, textarea, button, math';

function hasText(root: Node): boolean {
  const walker = root.ownerDocument?.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker?.nextNode(); node; node = walker?.nextNode()) {
    if (node.parentElement?.closest('style, script, template')) {
      continue;
    }
    if (node.textContent?.trim()) {
      return true;
    }
  }
  return false;
}

/** True when the element has rendered text, a control or a media node for a scan to inspect. */
export function hasRenderedContent(element: Element): boolean {
  const roots: Array<Element | ShadowRoot> = element.shadowRoot
    ? [element, element.shadowRoot]
    : [element];
  return roots.some((root) => !!root.querySelector(SCANNABLE_NODES) || hasText(root));
}

/** Images still loading. A lazy image may never load off screen, so it is not waited for. */
function hasPendingImages(element: Element): boolean {
  return [...element.querySelectorAll('img')].some(
    (image) => !image.complete && image.loading !== 'lazy'
  );
}

/**
 * Reports once `element` has rendered content, its images have loaded or failed, and its subtree
 * has stayed unchanged for `quietMs`. Reports `not-rendered` when the element has no content by
 * `timeoutMs`. Returns a function that stops watching without reporting.
 *
 * Attribute changes do not restart the quiet period: transitions and focus styling change
 * attributes on a rendered element for as long as it is on screen.
 */
export function watchRender(
  element: Element,
  onSettled: (outcome: RenderOutcome) => void,
  { quietMs = RENDER_QUIET_MS, timeoutMs = RENDER_TIMEOUT_MS }: RenderWatchOptions = {}
): () => void {
  let watching = true;
  let quietTimer: ReturnType<typeof setTimeout> | undefined;

  function restartQuietPeriod() {
    clearTimeout(quietTimer);
    quietTimer = setTimeout(() => {
      if (hasRenderedContent(element) && !hasPendingImages(element)) {
        settle('rendered');
      }
    }, quietMs);
  }

  const observer = new MutationObserver(restartQuietPeriod);
  observer.observe(element, { childList: true, subtree: true, characterData: true });
  // `load` and `error` do not bubble; a capturing listener sees them for every image inside.
  element.addEventListener('load', restartQuietPeriod, true);
  element.addEventListener('error', restartQuietPeriod, true);
  const deadline = setTimeout(
    () => settle(hasRenderedContent(element) ? 'rendered' : 'not-rendered'),
    timeoutMs
  );

  function stop() {
    watching = false;
    observer.disconnect();
    element.removeEventListener('load', restartQuietPeriod, true);
    element.removeEventListener('error', restartQuietPeriod, true);
    clearTimeout(quietTimer);
    clearTimeout(deadline);
  }

  function settle(outcome: RenderOutcome) {
    if (watching) {
      stop();
      onSettled(outcome);
    }
  }

  restartQuietPeriod();
  return stop;
}
