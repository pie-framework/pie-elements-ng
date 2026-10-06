import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { endSpeechOnWorkerFailure, type SpeechDocument } from '../src/speech-worker.js';

const WARNED = Symbol.for('@pie-element/shared-math-rendering-mathjax/speech-worker-failed');

/** A document whose adaptor starts a worker that fires `error` when the test says. */
function speechDocument(ready = false) {
  const worker = new EventTarget() as Worker;
  const handler = {
    ready,
    Post: vi.fn(() => new Promise(() => {})),
    Terminate: vi.fn(),
  };
  const mathDocument: SpeechDocument = {
    adaptor: { createWorker: vi.fn(async () => worker) },
    webworker: handler,
    options: { enableSpeech: true, enableBraille: true, speechError: vi.fn() },
  };
  endSpeechOnWorkerFailure(mathDocument);
  return { mathDocument, handler, worker };
}

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  delete (globalThis as any)[WARNED];
});

describe('a speech worker that fails', () => {
  it('before it is ready ends speech for the document, warning once per page', async () => {
    const { mathDocument, handler, worker } = speechDocument();
    await mathDocument.adaptor?.createWorker?.(() => {}, {});

    worker.dispatchEvent(new Event('error'));

    expect(handler.Terminate).toHaveBeenCalledTimes(1);
    await expect(handler.Post()).rejects.toThrow('The speech worker did not start');
    expect(mathDocument.options).toMatchObject({ enableSpeech: false, enableBraille: false });

    const other = speechDocument();
    await other.mathDocument.adaptor?.createWorker?.(() => {}, {});
    other.worker.dispatchEvent(new Event('error'));
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('MATH-RENDERING.md#assets'));
  });

  it('once it is ready leaves speech to MathJax', async () => {
    const { mathDocument, handler, worker } = speechDocument(true);
    await mathDocument.adaptor?.createWorker?.(() => {}, {});

    worker.dispatchEvent(new Event('error'));

    expect(handler.Terminate).not.toHaveBeenCalled();
    expect(mathDocument.options?.enableSpeech).toBe(true);
    expect(console.warn).not.toHaveBeenCalled();
  });
});
