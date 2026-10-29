/**
 * How the deliver route lays itself out.
 *
 * - `app` (the default): fixed-height panes, with the element scrolling inside its own pane, so
 *   `window` never scrolls.
 * - `page` (`?layout=page`): the document scrolls, with page content above and below the element,
 *   as on a host page showing a long item. The touch specs that check whether a swipe or a pinch
 *   over an element still reaches the page need it.
 */
export type PageLayout = 'app' | 'page';

export function parsePageLayout(value: string | null): PageLayout {
  return value === 'page' ? 'page' : 'app';
}
