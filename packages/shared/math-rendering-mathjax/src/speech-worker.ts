/**
 * MathJax generates speech in a web worker it starts from a `blob:` script that imports
 * `speech-worker.js` from the speech path. A worker that never starts, because the page's content
 * security policy refuses it or its script fails to load, leaves every speech task waiting for it,
 * and with them the typeset that asked for speech and every typeset after it. A document whose
 * worker fails before it is ready ends speech instead: the waiting tasks fail, later ones fail at
 * once, and math goes on rendering without speech, braille or the explorer.
 */
import { ASSETS_DOCS_URL } from './assets.js';

/** The parts of MathJax's `WorkerHandler` this module uses. */
interface WorkerHandler {
  ready: boolean;
  Post: (...args: unknown[]) => Promise<unknown>;
  Terminate: () => unknown;
}

/** The parts of a MathJax 4 document with speech that this module uses. */
export interface SpeechDocument {
  adaptor?: {
    createWorker?: (listener: unknown, options: unknown) => Promise<Worker>;
  };
  webworker?: WorkerHandler | null;
  options?: {
    enableSpeech?: boolean;
    enableBraille?: boolean;
    speechError?: (...args: unknown[]) => void;
  };
}

// Every element bundles its own copy of this module, so the warning is kept on the page.
const WARNED: unique symbol = Symbol.for(
  '@pie-element/shared-math-rendering-mathjax/speech-worker-failed'
);

type WarnRegistry = { [WARNED]?: boolean };

function warnOnce(): void {
  const registry = globalThis as WarnRegistry;
  if (registry[WARNED]) return;
  registry[WARNED] = true;
  console.warn(
    "[math-rendering] MathJax's speech worker did not start, so speech, braille and the " +
      'explorer are off. A content security policy must allow blob: workers, and scripts and ' +
      `fetches from the asset root. See ${ASSETS_DOCS_URL}`
  );
}

function endSpeech(mathDocument: SpeechDocument): void {
  const handler = mathDocument.webworker;
  if (!handler || handler.ready) return;
  mathDocument.options ??= {};
  const options = mathDocument.options;
  options.enableSpeech = false;
  options.enableBraille = false;
  // Each waiting task reports its failure through `speechError`; the warning stands for them all.
  options.speechError = () => {};
  handler.Post = () => Promise.reject(new Error('The speech worker did not start'));
  handler.Terminate();
  warnOnce();
}

/** Ends speech for `mathDocument` when a worker it starts fails before it is ready. */
export function endSpeechOnWorkerFailure(mathDocument: SpeechDocument | undefined): void {
  const adaptor = mathDocument?.adaptor;
  const createWorker = adaptor?.createWorker;
  if (!mathDocument || !adaptor || !createWorker) return;
  adaptor.createWorker = async (listener, options) => {
    const worker = await createWorker.call(adaptor, listener, options);
    worker.addEventListener('error', () => endSpeech(mathDocument), { once: true });
    return worker;
  };
}
