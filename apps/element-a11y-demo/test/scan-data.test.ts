import { describe, expect, it } from 'vitest';
import { getA11yScenariosForElement } from '../src/lib/a11y/scenarios/catalog';
import { loadA11yElementScanData } from '../src/lib/a11y/suite';

describe('a11y scan data', () => {
  it('scans a requested demo in the requested mode', async () => {
    const scan = await loadA11yElementScanData(
      'multiple-choice',
      null,
      'math-algebra-quadratic',
      'evaluate'
    );

    expect(scan?.activeScenario).toBeUndefined();
    expect(scan?.activeDemo.id).toBe('math-algebra-quadratic');
    expect(scan?.mode).toBe('evaluate');
    expect(scan?.role).toBe('instructor');
    expect(scan?.scanSource).toBe('inventory');
  });

  it('scans a requested scenario, in its own mode, over a requested demo', async () => {
    const scan = await loadA11yElementScanData(
      'multiple-choice',
      'evaluate-feedback-status',
      'math-algebra-quadratic',
      'gather'
    );

    expect(scan?.activeScenario?.id).toBe('evaluate-feedback-status');
    expect(scan?.mode).toBe('evaluate');
  });

  it("scans the element's first scenario when the request names neither", async () => {
    const scan = await loadA11yElementScanData('multiple-choice', null, null, null);

    expect(scan?.activeScenario?.id).toBe(getA11yScenariosForElement('multiple-choice')[0].id);
  });
});
