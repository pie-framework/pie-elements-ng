import { describe, expect, it } from 'vitest';
import {
  createTestModel,
  createTestModels,
  createTestSession,
  sleep,
  testPrompts,
  withTimeout,
} from '../src/fixtures';

describe('createTestModel', () => {
  it('creates a model with id and element', () => {
    const model = createTestModel();
    expect(model).toHaveProperty('id');
    expect(model).toHaveProperty('element');
    expect(model.element).toBe('@pie-element/test');
  });

  it('generates unique ids', () => {
    const model1 = createTestModel();
    const model2 = createTestModel();
    expect(model1.id).not.toBe(model2.id);
  });

  it('applies overrides', () => {
    const model = createTestModel({ element: '@pie-element/custom' });
    expect(model.element).toBe('@pie-element/custom');
  });

  it('preserves generated id when not overridden', () => {
    const model = createTestModel({ element: '@pie-element/custom' });
    expect(model.id).toBeTruthy();
    expect(typeof model.id).toBe('string');
  });

  it('allows id override', () => {
    const model = createTestModel({ id: 'custom-id' });
    expect(model.id).toBe('custom-id');
  });
});

describe('createTestSession', () => {
  it('creates a session with id', () => {
    const session = createTestSession();
    expect(session).toHaveProperty('id');
  });

  it('generates unique ids', () => {
    const session1 = createTestSession();
    const session2 = createTestSession();
    expect(session1.id).not.toBe(session2.id);
  });

  it('applies overrides', () => {
    const session = createTestSession({ response: 'answer' });
    expect(session.response).toBe('answer');
  });

  it('allows id override', () => {
    const session = createTestSession({ id: 'custom-id' });
    expect(session.id).toBe('custom-id');
  });

  it('allows multiple custom properties', () => {
    const session = createTestSession({
      response: 'answer',
      timestamp: 123456,
      userId: 'user-1',
    });
    expect(session.response).toBe('answer');
    expect(session.timestamp).toBe(123456);
    expect(session.userId).toBe('user-1');
  });
});

describe('createTestModels', () => {
  it('creates specified number of models', () => {
    const models = createTestModels(5);
    expect(models).toHaveLength(5);
  });

  it('creates zero models', () => {
    const models = createTestModels(0);
    expect(models).toHaveLength(0);
  });

  it('creates models with unique ids', () => {
    const models = createTestModels(10);
    const ids = models.map((m) => m.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(10);
  });

  it('creates models with sequential test ids', () => {
    const models = createTestModels(3);
    expect(models[0].id).toBe('test-0');
    expect(models[1].id).toBe('test-1');
    expect(models[2].id).toBe('test-2');
  });

  it('applies overrides to all models', () => {
    const models = createTestModels(3, { element: '@pie-element/custom' });
    models.forEach((model) => {
      expect(model.element).toBe('@pie-element/custom');
    });
  });

  it('preserves sequential ids with overrides', () => {
    const models = createTestModels(3, { element: '@pie-element/custom' });
    expect(models[0].id).toBe('test-0');
    expect(models[1].id).toBe('test-1');
    expect(models[2].id).toBe('test-2');
  });
});

describe('testPrompts', () => {
  it('has simple prompt', () => {
    expect(testPrompts.simple).toBeTruthy();
    expect(typeof testPrompts.simple).toBe('string');
  });

  it('has withHtml prompt with HTML tags', () => {
    expect(testPrompts.withHtml).toContain('<p>');
    expect(testPrompts.withHtml).toContain('<strong>');
  });

  it('has withMath prompt with LaTeX', () => {
    expect(testPrompts.withMath).toContain('$');
    expect(testPrompts.withMath).toContain('x^2');
  });

  it('has multiline prompt', () => {
    expect(testPrompts.multiline).toContain('<blockquote>');
    expect(testPrompts.multiline.split('\n').length).toBeGreaterThan(1);
  });
});

describe('withTimeout', () => {
  it('resolves when promise completes before timeout', async () => {
    const promise = new Promise((resolve) => setTimeout(() => resolve('success'), 50));
    const result = await withTimeout(promise, 200);
    expect(result).toBe('success');
  });

  it('rejects when promise exceeds timeout', async () => {
    const promise = new Promise((resolve) => setTimeout(() => resolve('success'), 200));
    await expect(withTimeout(promise, 50)).rejects.toThrow('Timeout after 50ms');
  });

  it('rejects with timeout error message', async () => {
    const promise = new Promise((resolve) => setTimeout(() => resolve('success'), 100));
    try {
      await withTimeout(promise, 50);
      expect.fail('Should have thrown timeout error');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('Timeout after 50ms');
    }
  });

  it('preserves rejected promise error', async () => {
    const promise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Custom error')), 50)
    );
    await expect(withTimeout(promise, 200)).rejects.toThrow('Custom error');
  });

  it('works with zero timeout', async () => {
    const promise = new Promise((resolve) => setTimeout(() => resolve('success'), 10));
    await expect(withTimeout(promise, 0)).rejects.toThrow('Timeout after 0ms');
  });
});

describe('sleep', () => {
  it('delays execution', async () => {
    const start = Date.now();
    await sleep(100);
    const duration = Date.now() - start;
    expect(duration).toBeGreaterThanOrEqual(95); // Allow small margin
    expect(duration).toBeLessThan(150);
  });

  it('resolves without value', async () => {
    const result = await sleep(10);
    expect(result).toBeUndefined();
  });

  it('can be awaited multiple times', async () => {
    await sleep(10);
    await sleep(10);
    await sleep(10);
    // If this completes, test passes
    expect(true).toBe(true);
  });

  it('handles zero delay', async () => {
    const start = Date.now();
    await sleep(0);
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(10);
  });
});
