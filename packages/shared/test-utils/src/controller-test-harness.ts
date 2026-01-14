/**
 * Controller Test Harness
 *
 * Provides utilities for testing PIE element controllers.
 */

import type {
  OutcomeResult,
  PieController,
  PieEnvironment,
  PieModel,
  PieSession,
} from '@pie-shared/types';

export interface ControllerTestCase {
  name: string;
  question: PieModel;
  session: PieSession | null;
  env: PieEnvironment;
  expectedViewModel?: Record<string, unknown>;
  expectedOutcome?: OutcomeResult;
}

export interface TestResult {
  passed: boolean;
  testCase: string;
  errors: string[];
}

/**
 * Test a controller with multiple test cases
 */
export async function testController(
  controller: PieController,
  testCases: ControllerTestCase[]
): Promise<TestResult[]> {
  const results: TestResult[] = [];

  for (const tc of testCases) {
    const errors: string[] = [];

    try {
      // Test model() function
      const viewModel = await controller.model(tc.question, tc.session, tc.env);

      if (tc.expectedViewModel) {
        for (const [key, expectedValue] of Object.entries(tc.expectedViewModel)) {
          if (JSON.stringify(viewModel[key]) !== JSON.stringify(expectedValue)) {
            errors.push(
              `Expected ${key} to be ${JSON.stringify(expectedValue)}, got ${JSON.stringify(viewModel[key])}`
            );
          }
        }
      }

      // Test outcome() function if session and expected outcome provided
      if (tc.expectedOutcome && tc.session) {
        const outcome = await controller.outcome(tc.question, tc.session, tc.env);
        if (
          outcome.score !== tc.expectedOutcome.score ||
          outcome.empty !== tc.expectedOutcome.empty
        ) {
          errors.push(
            `Expected outcome ${JSON.stringify(tc.expectedOutcome)}, got ${JSON.stringify(outcome)}`
          );
        }
      }
    } catch (error) {
      errors.push(`Exception: ${error instanceof Error ? error.message : String(error)}`);
    }

    results.push({
      passed: errors.length === 0,
      testCase: tc.name,
      errors,
    });
  }

  return results;
}

/**
 * Assert that a controller test passes
 */
export async function assertControllerTest(
  controller: PieController,
  testCase: ControllerTestCase
): Promise<void> {
  const results = await testController(controller, [testCase]);
  const result = results[0];

  if (!result.passed) {
    throw new Error(
      `Test "${result.testCase}" failed:\n${result.errors.map((e) => `  - ${e}`).join('\n')}`
    );
  }
}

/**
 * Create common test environments
 */
export const testEnvironments = {
  studentGather: { mode: 'gather' as const, role: 'student' as const },
  studentView: { mode: 'view' as const, role: 'student' as const },
  studentEvaluate: { mode: 'evaluate' as const, role: 'student' as const },
  instructorGather: { mode: 'gather' as const, role: 'instructor' as const },
  instructorView: { mode: 'view' as const, role: 'instructor' as const },
  instructorEvaluate: { mode: 'evaluate' as const, role: 'instructor' as const },
};

/**
 * Create a mock controller for testing
 */
export function createMockController(overrides?: Partial<PieController>): PieController {
  return {
    async model(question, _session, env) {
      return {
        disabled: env.mode !== 'gather',
        mode: env.mode,
        ...question,
      };
    },
    async outcome(_model, _session, _env) {
      return { score: 1, empty: false };
    },
    createDefaultModel(partial = {}) {
      return {
        id: 'test',
        element: '@pie-element/test',
        ...partial,
      };
    },
    validate(_model, _config) {
      return {};
    },
    createCorrectResponseSession(_question, _env) {
      return { id: 'test' };
    },
    ...overrides,
  };
}
