import { ModelSetEvent, SessionChangedEvent } from '@pie-element/shared-player-events';
import { writeSessionInPlace } from './write-session-in-place.js';

export interface DeliveryElementOptions<Model, Session> {
  /**
   * Whether `session` is a complete response to `model`. It is the `complete`
   * flag of every `model-set` and `session-changed` the element dispatches, which
   * is what a player gates the item's answered state on.
   */
  isComplete(model: Model | undefined, session: Session | undefined): boolean;
}

/**
 * The delivery custom element a player mounts: it owns the session the player
 * hands it and announces every change to it.
 */
export interface DeliveryElement<Model = unknown, Session = unknown> extends HTMLElement {
  model: Model | undefined;
  /** The session object the player set, with every update written into it. */
  session: Session | undefined;
  /**
   * The component's `onSessionChange` prop, which it calls with each update:
   * writes the update and dispatches `session-changed`.
   */
  onSessionChange: (session: Session) => void;
  /** `isComplete` for the current model and session. A subclass adds its own conditions here. */
  isComplete(): boolean;
  /**
   * Writes `next` into the player's session and hands the component `next`,
   * a fresh reference its `$derived` reads re-run on. Dispatches nothing.
   */
  writeSession(next: Session): void;
  dispatchSessionChanged(): void;
}

export type DeliveryElementConstructor<
  Model = unknown,
  Session = unknown,
> = new () => DeliveryElement<Model, Session>;

/** The class Svelte generates, with an accessor per declared prop. */
interface SvelteElement extends HTMLElement {
  get model(): unknown;
  set model(value: unknown);
  get session(): unknown;
  set session(value: unknown);
  onSessionChange?: unknown;
}

/**
 * The delivery custom element for `Component`, a Svelte component compiled
 * with `customElement` that declares `model`, `session` and an
 * `onSessionChange` callback prop.
 *
 * The session contract lives here, once, for every Svelte element: the update
 * is written into the object the player handed the element (`writeSessionInPlace`),
 * and `session-changed` and `model-set` are dispatched under the tag the player
 * registered the element with, carrying `complete` from `options.isComplete`.
 *
 * `onSessionChange` is an ordinary prop of the component, which the element
 * assigns in its constructor through the accessor Svelte generates for it; a
 * component mounted with `mount()` takes it like any other prop. A subclass
 * assigns its own callback props the same way.
 */
export function defineDeliveryElement<Model = unknown, Session = unknown>(
  Component: object,
  options: DeliveryElementOptions<Model, Session>
): DeliveryElementConstructor<Model, Session> {
  // The class Svelte generates for a component compiled with `customElement`.
  const Base = (Component as { element?: new () => SvelteElement }).element;
  if (!Base) {
    throw new TypeError(
      'defineDeliveryElement: the component was not compiled with `customElement`'
    );
  }

  class Element extends Base {
    #model: Model | undefined;
    #session: Session | undefined;
    declare onSessionChange: (session: Session) => void;

    constructor() {
      super();
      this.onSessionChange = (next: Session) => {
        this.writeSession(next);
        this.dispatchSessionChanged();
      };
    }

    /**
     * `model-set` is dispatched a microtask later: on load a player sets the
     * model and then the session in the same task (`element.model = …;
     * element.session = …`), and `complete` can only report a restored response
     * once the session is here.
     */
    set model(model: Model | undefined) {
      this.#model = model;
      super.model = model;
      queueMicrotask(() => {
        this.dispatchEvent(
          new ModelSetEvent(
            this.tagName.toLowerCase(),
            this.isComplete(),
            this.#model !== undefined
          )
        );
      });
    }

    get model(): Model | undefined {
      return this.#model;
    }

    /**
     * A re-set of the same object is an update, not a no-op: a player sets the
     * session before the model on load and again after it, and only that second
     * event can report a restored session as complete. A player that clears the
     * response in place re-sets its object the same way, and the component must
     * re-render it.
     */
    set session(session: Session | undefined) {
      this.#session = session;
      super.session = session;
      this.dispatchSessionChanged();
    }

    get session(): Session | undefined {
      return this.#session;
    }

    isComplete(): boolean {
      return options.isComplete(this.#model, this.#session);
    }

    writeSession(next: Session): void {
      // A frozen or missing player session cannot be written into; `next` then
      // replaces it, as `writeSessionInPlace` returns.
      this.#session = writeSessionInPlace(this.#session, next) as Session;
      super.session = next;
    }

    dispatchSessionChanged(): void {
      this.dispatchEvent(new SessionChangedEvent(this.tagName.toLowerCase(), this.isComplete()));
    }
  }

  return Element as unknown as DeliveryElementConstructor<Model, Session>;
}
