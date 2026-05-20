import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';
import { loadA11yElementScanData } from '$lib/a11y/suite';

// A11y scan targets mount custom elements and are browser-only.
export const ssr = false;

export const load: PageLoad = async ({ params, url }) => {
  const scanData = await loadA11yElementScanData(
    params.element,
    url.searchParams.get('scenario'),
    url.searchParams.get('demo'),
    url.searchParams.get('mode'),
    url.searchParams.get('player')
  );

  if (!scanData) {
    throw error(404, `Unknown PIE element: ${params.element}`);
  }

  return {
    ...scanData,
    elementVersion: 'latest',
  };
};
