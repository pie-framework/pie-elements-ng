import type { PageLoad } from './$types';
import { getA11yInventory } from '$lib/a11y/suite';

export const load: PageLoad = async () => {
  const inventory = await getA11yInventory();

  return {
    inventory,
    totalElements: inventory.length,
    totalScanTargets: inventory.reduce(
      (sum, element) => sum + element.demos.length * element.scanModes.length,
      0
    ),
  };
};
