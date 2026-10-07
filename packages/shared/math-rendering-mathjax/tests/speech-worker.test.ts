import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  endSpeechOnWorkerFailure,
  type SpeechDocument,
  speechWorkerScript,
} from '../src/speech-worker.js';

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

/** Runs a worker script against a global that records what it imports and fetches. */
function runWorkerScript(script: string) {
  const imported: string[] = [];
  const fetched: unknown[] = [];
  const global = {
    maps: undefined as string | undefined,
    fetch(input: unknown) {
      fetched.push(input);
      return Promise.resolve(new Response('{}'));
    },
  };
  new Function('self', 'importScripts', script)(global, (url: string) => imported.push(url));
  return { global, imported, fetched };
}

describe('the speech worker script', () => {
  const SRE = 'https://assets.test/npm/mathjax@4.1.3/sre';

  it('imports the worker from the speech path, and fetches mathmaps from there', async () => {
    const script = speechWorkerScript({ speechPath: SRE }) ?? '';
    const { global, imported, fetched } = runWorkerScript(script);

    expect(global.maps).toBe(`${SRE}/mathmaps`);
    expect(imported).toEqual([`${SRE}/speech-worker.js`]);
    await global.fetch(`${SRE}/mathmaps/en.json`);
    expect(fetched).toEqual([`${SRE}/mathmaps/en.json`]);
  });

  it('takes the worker and each mathmap the assets list from its URL', async () => {
    const urls = new Map([
      ['mathjax@4.1.3/sre/speech-worker.js', 'https://host.test/speech-worker-1a.js'],
      ['mathjax@4.1.3/sre/mathmaps/en.json', 'https://host.test/en-2b.json'],
    ]);
    const { global, imported, fetched } = runWorkerScript(speechWorkerScript({ urls }) ?? '');

    expect(imported).toEqual(['https://host.test/speech-worker-1a.js']);
    await global.fetch(`${global.maps}/en.json`);
    await global.fetch(`${global.maps}/de.json`);
    expect(fetched).toEqual(['https://host.test/en-2b.json', `${global.maps}/de.json`]);
  });

  it('is undefined without a speech worker', () => {
    expect(speechWorkerScript({})).toBeUndefined();
    expect(
      speechWorkerScript({ urls: new Map([['mathjax@4.1.3/sre/mathmaps/en.json', 'x']]) })
    ).toBeUndefined();
  });
});
