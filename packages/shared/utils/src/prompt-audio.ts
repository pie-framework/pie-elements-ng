/**
 * A prompt's audio, shared by the elements with authored `autoplayAudioEnabled` and
 * `completeAudioEnabled` settings, in three layers: `PromptAudioTracker` holds the playback state
 * and writes its timing into the session without touching the DOM, so an element of any framework
 * feeds it; `bindPromptAudio` feeds it from an `<audio>`; `PromptAudioWatcher` finds the audio in
 * a rendered prompt and offers to enable autoplay a browser blocked.
 */

export interface AutoplayAudioFields {
  autoplayAudioEnabled?: boolean;
  /** Written by pie-players' item player when the toolkit holds autoplay for the item. */
  autoplayAudioHeld?: boolean;
}

export interface PromptAudioSettings extends AutoplayAudioFields {
  /** Keeps the item incomplete until the prompt audio has played to the end. */
  completeAudioEnabled?: boolean;
}

/** Whether the prompt audio starts on its own. A hold outranks the authored setting. */
export const autoplayAudioOn = (fields?: AutoplayAudioFields | null): boolean =>
  !!fields?.autoplayAudioEnabled && !fields?.autoplayAudioHeld;

/**
 * The markup switches `autoplayAudioEnabled` replaces. `sanitizeModelHtml` removes them from
 * model HTML, so the model setting is the only start for prompt audio and a hold can stop it.
 * pie-players' item player removes the same from item markup through its autoplay applier.
 */
export const AUTOPLAY_AUDIO_MARKUP_ATTRS: readonly string[] = ['autoplay'];

/** The session fields a prompt's first playback is recorded in, all epoch or elapsed milliseconds. */
export interface PromptAudioTiming {
  audioStartTime?: number;
  audioEndTime?: number;
  /** `audioEndTime - audioStartTime`: how long the learner waited on the audio. */
  waitTime?: number;
}

/**
 * `session` with a playback's timing recorded. The first playback counts, so a replay moves
 * neither timestamp, and `waitTime` is set once both exist.
 */
export function withPromptAudioTiming<S extends PromptAudioTiming>(
  session: S,
  timing: Pick<PromptAudioTiming, 'audioStartTime' | 'audioEndTime'>
): S {
  const audioStartTime = session.audioStartTime || timing.audioStartTime;
  const audioEndTime = session.audioEndTime || timing.audioEndTime;
  const next: S = {
    ...session,
    ...(audioStartTime ? { audioStartTime } : {}),
    ...(audioEndTime ? { audioEndTime } : {}),
  };
  if (!next.waitTime && audioStartTime && audioEndTime) {
    next.waitTime = audioEndTime - audioStartTime;
  }
  return next;
}

/** What a `PromptAudioTracker` needs from the element whose prompt audio it tracks. */
export interface PromptAudioHost<S extends PromptAudioTiming = PromptAudioTiming> {
  /** The session playback timing is recorded in. */
  session(): S | null | undefined;
  /** Stores `next`, the session with playback timing recorded. */
  writeSession(next: S): void;
  /** Dispatches the element's session change: the audio ended or failed, so completion moved. */
  announce(): void;
}

/**
 * The playback state of a prompt's audio, which `completeAudioEnabled` gates completion on. The
 * element records what its audio reports; the tracker writes the timing into the session and
 * announces the playback ending or failing as a session change, which hosts gate completion on.
 */
export class PromptAudioTracker<S extends PromptAudioTiming = PromptAudioTiming> {
  #host: PromptAudioHost<S>;
  #source: string | undefined;
  #ended = false;
  #failed = false;

  constructor(host: PromptAudioHost<S>) {
    this.#host = host;
  }

  /** The audio played to the end on this mount. */
  get hasEnded(): boolean {
    return this.#ended;
  }

  /** The audio could not load, so completion no longer waits on it. */
  get hasFailed(): boolean {
    return this.#failed;
  }

  /**
   * Whether completion still waits on the audio: it has not failed to load, and neither this mount
   * nor the session (`audioEndTime`, kept across a resume) records it as played.
   */
  get pending(): boolean {
    return !this.#ended && !this.#failed && !this.#host.session()?.audioEndTime;
  }

  /**
   * Follows the audio at `source`. A different source starts the playback state over; the same one
   * keeps it, so a re-render or a re-set of the same model keeps a finished playback counted.
   */
  follow(source: string | undefined): void {
    if (source === this.#source) return;
    this.#source = source;
    this.#ended = false;
    this.#failed = false;
  }

  recordStart(now = Date.now()): void {
    this.#record({ audioStartTime: now });
  }

  recordEnd(now = Date.now()): void {
    this.#record({ audioEndTime: now });
    if (this.#ended) return;
    this.#ended = true;
    this.#host.announce();
  }

  recordFailure(): void {
    if (this.#failed) return;
    this.#failed = true;
    this.#host.announce();
  }

  #record(timing: Pick<PromptAudioTiming, 'audioStartTime' | 'audioEndTime'>): void {
    const session = this.#host.session() ?? ({} as S);
    const next = withPromptAudioTiming(session, timing);
    const changed =
      next.audioStartTime !== session.audioStartTime ||
      next.audioEndTime !== session.audioEndTime ||
      next.waitTime !== session.waitTime;
    if (changed) this.#host.writeSession(next);
  }
}

const sourceOf = (audio: HTMLAudioElement): string =>
  audio.getAttribute('src') ||
  audio.querySelector('source[src]:not([src=""])')?.getAttribute('src') ||
  '';

/**
 * Feeds `audio`'s playback into `tracker`, which follows its source. A `<source>` reports its load
 * failure on itself, so the error listener captures. Returns the listeners' remover.
 */
export function bindPromptAudio(
  audio: HTMLAudioElement,
  tracker: PromptAudioTracker<any>
): () => void {
  tracker.follow(sourceOf(audio));
  const handlePlaying = () => tracker.recordStart();
  const handleEnded = () => tracker.recordEnd();
  const handleError = () => tracker.recordFailure();
  audio.addEventListener('playing', handlePlaying);
  audio.addEventListener('ended', handleEnded);
  audio.addEventListener('error', handleError, true);
  return () => {
    audio.removeEventListener('playing', handlePlaying);
    audio.removeEventListener('ended', handleEnded);
    audio.removeEventListener('error', handleError, true);
  };
}

/** The audio `completeAudioEnabled` waits on in a rendered element: the first, when it is in a prompt. */
const promptAudioIn = (root: ParentNode | null | undefined): HTMLAudioElement | null => {
  const audio = root?.querySelector('audio');
  return audio?.closest('.preview-prompt') ? audio : null;
};

/**
 * Whether `completeAudioEnabled` still waits on the prompt audio rendered in `root`: the audio has
 * a source, has not failed to load, and `tracker` does not record it as played.
 */
export function promptAudioPending(
  root: ParentNode | null | undefined,
  tracker: PromptAudioTracker<any>
): boolean {
  if (!tracker.pending) return false;
  const audio = promptAudioIn(root);
  return !!audio && sourceOf(audio) !== '' && audio.error === null;
}

const TOAST_CLASS = 'play-audio-info';
/** How long autoplay gets to start before the toast offers to start it. Safari reports a blocked play late. */
const AUTOPLAY_CHECK_DELAY_MS = 500;

export interface PromptAudioWatcherOptions {
  /** The element whose rendered prompt holds the audio. */
  root: HTMLElement;
  tracker: PromptAudioTracker<any>;
  /** The current model's audio settings; nothing is tracked while neither setting is on. */
  settings(): PromptAudioSettings | null | undefined;
  /** The image the toast offering to enable blocked autoplay shows. */
  enableAudioImage: string;
}

/**
 * Binds the prompt audio an element renders to its tracker, rebinding when the element renders
 * another `<audio>`. When autoplay is on and the browser blocked it, a toast over the element's
 * `.main-container` offers to start the audio on the next click anywhere in the document.
 */
export class PromptAudioWatcher {
  #options: PromptAudioWatcherOptions;
  #observer: MutationObserver | null = null;
  #audio: HTMLAudioElement | null = null;
  #unbind: (() => void) | null = null;

  constructor(options: PromptAudioWatcherOptions) {
    this.#options = options;
  }

  connect(): void {
    if (this.#observer) return;
    this.#observer = new MutationObserver(() => this.#scan());
    this.#observer.observe(this.#options.root, { childList: true, subtree: true });
    this.#scan();
  }

  disconnect(): void {
    this.#observer?.disconnect();
    this.#observer = null;
    this.#release();
  }

  #scan(): void {
    const settings = this.#options.settings();
    if (!autoplayAudioOn(settings) && !settings?.completeAudioEnabled) return;
    const audio = promptAudioIn(this.#options.root);
    if (!audio || audio === this.#audio) return;
    this.#release();
    this.#bind(audio, autoplayAudioOn(settings));
  }

  #bind(audio: HTMLAudioElement, autoplay: boolean): void {
    const { root, tracker, enableAudioImage } = this.#options;
    const stopTracking = bindPromptAudio(audio, tracker);
    const toast = createToast(enableAudioImage);
    const enableAudio = () => {
      if (toast.isConnected) {
        audio.play()?.catch(() => {});
        toast.remove();
      }
      document.removeEventListener('click', enableAudio);
    };
    // Autoplay can also start on a re-render, after the toast is up.
    const removeToast = () => toast.remove();
    audio.addEventListener('playing', removeToast);

    const timer = autoplay
      ? setTimeout(() => {
          if (audio.paused && !root.querySelector(`.${TOAST_CLASS}`)) {
            (root.querySelector('.main-container') ?? root).appendChild(toast);
            document.addEventListener('click', enableAudio);
          }
        }, AUTOPLAY_CHECK_DELAY_MS)
      : undefined;

    this.#audio = audio;
    this.#unbind = () => {
      clearTimeout(timer);
      stopTracking();
      audio.removeEventListener('playing', removeToast);
      document.removeEventListener('click', enableAudio);
      toast.remove();
    };
  }

  #release(): void {
    this.#unbind?.();
    this.#unbind = null;
    this.#audio = null;
  }
}

function createToast(image: string): HTMLElement {
  const toast = document.createElement('div');
  // Looked up by its class, which authored CSS may also target; a fixed id repeats when items share a page.
  toast.id = `${TOAST_CLASS}-${Math.random().toString(36).slice(2, 10)}`;
  toast.className = TOAST_CLASS;
  Object.assign(toast.style, {
    position: 'absolute',
    top: '0',
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'white',
    zIndex: '1000',
    cursor: 'pointer',
  });

  const img = document.createElement('img');
  img.src = image;
  img.alt = 'Click anywhere to enable audio autoplay';
  img.width = 500;
  img.height = 300;
  toast.appendChild(img);
  return toast;
}
