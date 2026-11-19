/**
 * MathJax generates speech in a web worker it starts from a `blob:` script that imports
 * `speech-worker.js` from the speech path. A worker that never starts, because the page's content
 * security policy refuses it or its script fails to load, leaves every speech task waiting for it,
 * and with them the typeset that asked for speech and every typeset after it. A document whose
 * worker fails before it is ready ends speech instead: the waiting tasks fail, later ones fail at
 * once, and math goes on rendering without speech, braille or the explorer.
 *
 * The browser build starts the worker itself, from the speech directory or the URLs a bundle lists
 * for its files.
 */
import { ASSETS_DOCS_URL, type MathjaxAssets, SRE_PATH, speechFileUrl } from './assets.js';

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

/**
 * Releases `blob:` URLs once `worker` signals it started or failed, and after a
 * grace period should neither happen. WebKit loads the `blob:` script
 * asynchronously, so revoking before the fetch completes breaks the worker in
 * Safari: speech, braille and the explorer stay off for every Safari student
 * (Chromium and Firefox fetch the script synchronously, which is why
 * Chromium-only testing missed it).
 */
function releaseBlobUrlsOn(worker: Worker, urls: string[]): void {
  const release = () => {
    for (const url of urls) URL.revokeObjectURL(url);
  };
  worker.addEventListener('message', release, { once: true });
  worker.addEventListener('error', release, { once: true });
  setTimeout(release, 10_000);
}

type RevokeObjectURL = (url: string) => void;

/**
 * Runs `createWorker` with MathJax's `revokeObjectURL` calls held back, then
 * releases them through `releaseBlobUrlsOn`. MathJax 4's adaptor revokes its
 * worker's `blob:` URL synchronously after `new Worker` — the timing WebKit
 * cannot tolerate.
 */
async function startWorkerWithDeferredRevoke(
  createWorker: (listener: unknown, options: unknown) => Promise<Worker>,
  self: unknown,
  listener: unknown,
  options: unknown
): Promise<Worker> {
  const deferred: string[] = [];
  const originalRevoke = URL.revokeObjectURL.bind(URL);
  (URL as unknown as { revokeObjectURL: RevokeObjectURL }).revokeObjectURL = (url) => {
    deferred.push(url);
  };
  let worker: Worker;
  try {
    worker = await createWorker.call(self, listener, options);
  } catch (error) {
    // No worker: nothing can signal readiness, so release at once.
    for (const url of deferred) originalRevoke(url);
    throw error;
  } finally {
    (URL as unknown as { revokeObjectURL: RevokeObjectURL }).revokeObjectURL = originalRevoke;
  }
  releaseBlobUrlsOn(worker, deferred);
  return worker;
}

/** Ends speech for `mathDocument` when a worker it starts fails before it is ready. */
export function endSpeechOnWorkerFailure(mathDocument: SpeechDocument | undefined): void {
  const adaptor = mathDocument?.adaptor;
  const createWorker = adaptor?.createWorker;
  if (!mathDocument || !adaptor || !createWorker) return;
  adaptor.createWorker = async (listener, options) => {
    const worker = await startWorkerWithDeferredRevoke(createWorker, adaptor, listener, options);
    worker.addEventListener('error', () => endSpeech(mathDocument), { once: true });
    return worker;
  };
}

const MAPS_PATH = `${SRE_PATH}/mathmaps/`;

/**
 * The `blob:` script of the speech worker for `assets`. As MathJax's adaptor writes it, it sets the
 * mathmaps directory and imports `speech-worker.js`, which fetches each mathmap as
 * `<self.maps>/<file>`; a mathmap `assets.urls` lists is fetched from its URL. Undefined without a
 * speech worker.
 */
export function speechWorkerScript(assets: MathjaxAssets): string | undefined {
  const worker = speechFileUrl(assets, 'speech-worker.js');
  if (!worker) return undefined;
  const maps = assets.speechPath ? `${assets.speechPath}/mathmaps` : 'mathmaps';
  const mapped: Record<string, string> = {};
  for (const [path, url] of assets.urls ?? []) {
    if (path.startsWith(MAPS_PATH)) mapped[`${maps}/${path.slice(MAPS_PATH.length)}`] = url;
  }
  const lines = [`self.maps = ${JSON.stringify(maps)};`];
  if (Object.keys(mapped).length) {
    // A block, so its names stay out of the scope `speech-worker.js` declares its own in.
    lines.push(
      '{',
      `  const urls = new Map(Object.entries(${JSON.stringify(mapped)}));`,
      '  const fetchFile = self.fetch.bind(self);',
      '  self.fetch = (input, init) => fetchFile(urls.get(input) ?? input, init);',
      '}'
    );
  }
  lines.push(`importScripts(${JSON.stringify(worker)});`);
  return lines.join('\n');
}

/** Starts a worker running `script` from a `blob:` URL, as MathJax's adaptor does. */
export function startWorker(script: string, listener: (event: MessageEvent) => void): Worker {
  const url = URL.createObjectURL(new Blob([script], { type: 'text/javascript' }));
  const worker = new Worker(url);
  worker.onmessage = listener;
  releaseBlobUrlsOn(worker, [url]);
  return worker;
}
