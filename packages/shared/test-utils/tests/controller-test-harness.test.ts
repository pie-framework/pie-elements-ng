import type { PieModel, PieSession } from '@pie-element/shared-types';
import { describe, expect, it } from 'vitest';
import {
  assertControllerTest,
  type ControllerTestCase,
  createMockController,
  testController,
  testEnvironments,
} from '../src/controller-test-harness';

describe('testEnvironments', () => {
  it('has studentGather environment', () => {
    expect(testEnvironments.studentGather).toEqual({ mode: 'gather', role: 'student' });
  });

  it('has studentView environment', () => {
    expect(testEnvironments.studentView).toEqual({ mode: 'view', role: 'student' });
  });

  it('has studentEvaluate environment', () => {
    expect(testEnvironments.studentEvaluate).toEqual({ mode: 'evaluate', role: 'student' });
  });

  it('has instructorGather environment', () => {
    expect(testEnvironments.instructorGather).toEqual({ mode: 'gather', role: 'instructor' });
  });

  it('has instructorView environment', () => {
    expect(testEnvironments.instructorView).toEqual({ mode: 'view', role: 'instructor' });
  });

  it('has instructorEvaluate environment', () => {
    expect(testEnvironments.instructorEvaluate).toEqual({ mode: 'evaluate', role: 'instructor' });
  });
});

describe('createMockController', () => {
  it('creates a controller with all required methods', () => {
    const controller = createMockController();
    expect(controller.model).toBeTypeOf('function');
    expect(controller.outcome).toBeTypeOf('function');
    expect(controller.createDefaultModel).toBeTypeOf('function');
    expect(controller.validate).toBeTypeOf('function');
    expect(controller.createCorrectResponseSession).toBeTypeOf('function');
  });

  it('model returns disabled based on mode', async () => {
    const controller = createMockController();
    const question: PieModel = { id: '1', element: 'test' };

    const gatherResult = await controller.model(question, null, testEnvironments.studentGather);
    expect(gatherResult.disabled).toBe(false);

    const viewResult = await controller.model(question, null, testEnvironments.studentView);
    expect(viewResult.disabled).toBe(true);

    const evaluateResult = await controller.model(question, null, testEnvironments.studentEvaluate);
    expect(evaluateResult.disabled).toBe(true);
  });

  it('model includes question properties', async () => {
    const controller = createMockController();
    const question: PieModel = { id: '1', element: 'test', custom: 'value' };
    const result = await controller.model(question, null, testEnvironments.studentGather);
    expect(result.id).toBe('1');
    expect(result.element).toBe('test');
    expect(result.custom).toBe('value');
  });

  it('outcome returns default result', async () => {
    const controller = createMockController();
    const question: PieModel = { id: '1', element: 'test' };
    const session: PieSession = { id: 's1' };
    const result = await controller.outcome(question, session, testEnvironments.studentEvaluate);
    expect(result.score).toBe(1);
    expect(result.empty).toBe(false);
  });

  it('createDefaultModel returns basic model', () => {
    const controller = createMockController();
    const model = controller.createDefaultModel();
    expect(model.id).toBe('test');
    expect(model.element).toBe('@pie-element/test');
  });

  it('createDefaultModel applies partial', () => {
    const controller = createMockController();
    const model = controller.createDefaultModel({ id: 'custom' });
    expect(model.id).toBe('custom');
  });

  it('validate returns empty errors', () => {
    const controller = createMockController();
    const errors = controller.validate({ id: '1', element: 'test' }, {});
    expect(errors).toEqual({});
  });

  it('createCorrectResponseSession returns session', () => {
    const controller = createMockController();
    const session = controller.createCorrectResponseSession(
      { id: '1', element: 'test' },
      testEnvironments.studentGather
    );
    expect(session.id).toBe('test');
  });

  it('allows overriding model method', async () => {
    const controller = createMockController({
      async model(_question, _session, _env) {
        return {
          disabled: false,
          mode: 'gather',
          customField: 'custom',
        };
      },
    });
    const result = await controller.model(
      { id: '1', element: 'test' },
      null,
      testEnvironments.studentGather
    );
    expect(result.customField).toBe('custom');
  });

  it('allows overriding outcome method', async () => {
    const controller = createMockController({
      async outcome() {
        return { score: 0.5, empty: true };
      },
    });
    const result = await controller.outcome(
      { id: '1', element: 'test' },
      { id: 's1' },
      testEnvironments.studentEvaluate
    );
    expect(result.score).toBe(0.5);
    expect(result.empty).toBe(true);
  });
});

describe('testController', () => {
  it('passes when view model matches expectations', async () => {
    const controller = createMockController();
    const testCases: ControllerTestCase[] = [
      {
        name: 'test',
        question: { id: '1', element: 'test' },
        session: null,
        env: testEnvironments.studentGather,
        expectedViewModel: { disabled: false, mode: 'gather' },
      },
    ];

    const results = await testController(controller, testCases);
    expect(results).toHaveLength(1);
    expect(results[0].passed).toBe(true);
    expect(results[0].testCase).toBe('test');
    expect(results[0].errors).toEqual([]);
  });

  it('fails when view model does not match expectations', async () => {
    const controller = createMockController();
    const testCases: ControllerTestCase[] = [
      {
        name: 'test',
        question: { id: '1', element: 'test' },
        session: null,
        env: testEnvironments.studentGather,
        expectedViewModel: { disabled: true }, // Wrong expectation
      },
    ];

    const results = await testController(controller, testCases);
    expect(results).toHaveLength(1);
    expect(results[0].passed).toBe(false);
    expect(results[0].errors.length).toBeGreaterThan(0);
    expect(results[0].errors[0]).toContain('disabled');
  });

  it('passes when outcome matches expectations', async () => {
    const controller = createMockController();
    const testCases: ControllerTestCase[] = [
      {
        name: 'test',
        question: { id: '1', element: 'test' },
        session: { id: 's1' },
        env: testEnvironments.studentEvaluate,
        expectedOutcome: { score: 1, empty: false },
      },
    ];

    const results = await testController(controller, testCases);
    expect(results[0].passed).toBe(true);
  });

  it('fails when outcome does not match expectations', async () => {
    const controller = createMockController();
    const testCases: ControllerTestCase[] = [
      {
        name: 'test',
        question: { id: '1', element: 'test' },
        session: { id: 's1' },
        env: testEnvironments.studentEvaluate,
        expectedOutcome: { score: 0.5, empty: false }, // Wrong expectation
      },
    ];

    const results = await testController(controller, testCases);
    expect(results[0].passed).toBe(false);
    expect(results[0].errors[0]).toContain('outcome');
  });

  it('handles multiple test cases', async () => {
    const controller = createMockController();
    const testCases: ControllerTestCase[] = [
      {
        name: 'test1',
        question: { id: '1', element: 'test' },
        session: null,
        env: testEnvironments.studentGather,
        expectedViewModel: { disabled: false },
      },
      {
        name: 'test2',
        question: { id: '2', element: 'test' },
        session: null,
        env: testEnvironments.studentView,
        expectedViewModel: { disabled: true },
      },
    ];

    const results = await testController(controller, testCases);
    expect(results).toHaveLength(2);
    expect(results[0].passed).toBe(true);
    expect(results[1].passed).toBe(true);
  });

  it('catches exceptions in controller methods', async () => {
    const controller = createMockController({
      async model() {
        throw new Error('Test error');
      },
    });
    const testCases: ControllerTestCase[] = [
      {
        name: 'test',
        question: { id: '1', element: 'test' },
        session: null,
        env: testEnvironments.studentGather,
      },
    ];

    const results = await testController(controller, testCases);
    expect(results[0].passed).toBe(false);
    expect(results[0].errors[0]).toContain('Test error');
  });

  it('skips outcome test when session is null', async () => {
    const controller = createMockController();
    const testCases: ControllerTestCase[] = [
      {
        name: 'test',
        question: { id: '1', element: 'test' },
        session: null,
        env: testEnvironments.studentGather,
        expectedOutcome: { score: 1, empty: false },
      },
    ];

    const results = await testController(controller, testCases);
    // Should pass because outcome test is skipped when session is null
    expect(results[0].passed).toBe(true);
  });
});

describe('assertControllerTest', () => {
  it('does not throw when test passes', async () => {
    const controller = createMockController();
    const testCase: ControllerTestCase = {
      name: 'test',
      question: { id: '1', element: 'test' },
      session: null,
      env: testEnvironments.studentGather,
      expectedViewModel: { disabled: false },
    };

    await expect(assertControllerTest(controller, testCase)).resolves.toBeUndefined();
  });

  it('throws when test fails', async () => {
    const controller = createMockController();
    const testCase: ControllerTestCase = {
      name: 'test',
      question: { id: '1', element: 'test' },
      session: null,
      env: testEnvironments.studentGather,
      expectedViewModel: { disabled: true }, // Wrong expectation
    };

    await expect(assertControllerTest(controller, testCase)).rejects.toThrow('Test "test" failed');
  });

  it('includes error details in thrown error', async () => {
    const controller = createMockController();
    const testCase: ControllerTestCase = {
      name: 'my test',
      question: { id: '1', element: 'test' },
      session: null,
      env: testEnvironments.studentGather,
      expectedViewModel: { disabled: true },
    };

    try {
      await assertControllerTest(controller, testCase);
      expect.fail('Should have thrown error');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      const message = (error as Error).message;
      expect(message).toContain('my test');
      expect(message).toContain('disabled');
    }
  });
});
