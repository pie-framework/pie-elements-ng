/**
 * Landing page configuration
 * SSR enabled for better initial load performance
 */
import type { PageLoad } from './$types';
import { getAllElements } from '$lib/elements/registry';

export const load: PageLoad = () => {
  const elements = getAllElements();

  return {
    elements,
  };
};
