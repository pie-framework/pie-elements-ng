import { describe, expect, it } from 'vitest';
import { model as complexRubricModel } from '../../../packages/elements-react/complex-rubric/src/controller/index';
import { model as rubricModel } from '../../../packages/elements-react/rubric/src/controller/index';
import { getA11yScenariosForElement } from '../src/lib/a11y/scenarios/catalog';

type ControllerModel = (
  model: unknown,
  session: unknown,
  env: { mode: string; role: string }
) => Promise<unknown>;

const rubricControllers: Record<string, ControllerModel> = {
  rubric: rubricModel,
  'complex-rubric': complexRubricModel,
};

const rubricScenarios = Object.entries(rubricControllers).flatMap(([element, model]) =>
  getA11yScenariosForElement(element).map(
    (scenario) => [`${element}/${scenario.id}`, scenario, model] as const
  )
);

describe('a11y scenario catalog', () => {
  it.each(rubricScenarios)(
    'scans %s in a role its controller renders a rubric for',
    async (_name, scenario, model) => {
      const viewModel = await model(scenario.model, scenario.session, {
        mode: scenario.mode,
        role: scenario.role,
      });

      expect(viewModel).toBeTruthy();
      expect(viewModel).not.toEqual({});
    }
  );
});
