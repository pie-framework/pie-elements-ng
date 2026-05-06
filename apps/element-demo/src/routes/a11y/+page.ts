import type { PageLoad } from './$types';
import { getA11yScenarioInventory } from '$lib/a11y/suite';

export const load: PageLoad = async () => {
  const inventory = getA11yScenarioInventory();

  return {
    inventory,
    totalElements: inventory.length,
    totalScanTargets: inventory.reduce((sum, element) => sum + element.scenarios.length, 0),
    coveredElements: inventory.filter((element) => element.scenarios.length > 0).length,
  };
};
