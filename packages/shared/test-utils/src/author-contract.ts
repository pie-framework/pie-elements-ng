/**
 * Author Element Contract
 *
 * Checks for the host-facing half of an author element, as
 * `docs/PIE_ELEMENT_CONTRACT.md` sets it out under "Authoring Contract". They
 * throw on a violation, so they run under any test runner.
 */

type AuthorElement = HTMLElement & { model?: unknown; configuration?: unknown };

type ModelUpdated = CustomEvent<{ update: unknown; reset: boolean }> & {
  update?: unknown;
  reset?: unknown;
};

export interface AuthorModelUpdateOptions {
  /** A tag the author element is registered under. */
  tag: string;
  /** The item's model, with the `id` and `element` a player stamps on it. */
  model: Record<string, unknown>;
  configuration?: Record<string, unknown>;
  /** Makes one edit through the authoring view. */
  edit: (element: HTMLElement) => void | Promise<void>;
  /** Lets the element render once its properties are set; defaults to one macrotask. */
  settle?: () => void | Promise<void>;
}

export interface AuthorModelUpdate {
  element: HTMLElement;
  /** The edit's `model.updated`, as a host hears it. */
  event: ModelUpdated;
  /** Removes the element and the ancestor it was mounted under. */
  cleanup: () => void;
}

const PLAYER_PROPERTIES = ['model', 'configuration'] as const;

function hasSetter(prototype: object | null, name: string): boolean {
  for (let p = prototype; p && p !== HTMLElement.prototype; p = Object.getPrototypeOf(p)) {
    if (Object.getOwnPropertyDescriptor(p, name)?.set) return true;
  }
  return false;
}

// Models are JSON: compare as such, with key order ignored.
function sameJson(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const aKeys = Object.keys(a).filter((k) => (a as any)[k] !== undefined);
  const bKeys = Object.keys(b).filter((k) => (b as any)[k] !== undefined);
  return (
    aKeys.length === bKeys.length && aKeys.every((k) => sameJson((a as any)[k], (b as any)[k]))
  );
}

function fail(tag: string, problems: string[]): void {
  if (problems.length) {
    throw new Error(`${tag} breaks the authoring contract:\n- ${problems.join('\n- ')}`);
  }
}

/** Throws unless the element declares the properties a player sets: `model`, then `configuration`. */
export function assertAuthorElementProperties(tag: string): void {
  const ctor = customElements.get(tag);
  if (!ctor) throw new Error(`${tag} is not registered`);
  fail(
    tag,
    PLAYER_PROPERTIES.filter((name) => !hasSetter(ctor.prototype, name)).map(
      (name) => `declares no \`${name}\` property, so a player's \`element.${name} = …\` is ignored`
    )
  );
}

/**
 * Mounts the element under an ancestor, sets `model` and `configuration` as a
 * player does, makes the edit, and throws unless exactly one `model.updated`
 * meets the contract. Returns that event for element-specific assertions.
 */
export async function assertAuthorModelUpdate(
  options: AuthorModelUpdateOptions
): Promise<AuthorModelUpdate> {
  const {
    tag,
    model,
    configuration,
    edit,
    settle = () => new Promise((r) => setTimeout(r, 0)),
  } = options;
  assertAuthorElementProperties(tag);

  const root = document.createElement('div');
  document.body.appendChild(root);
  const element = document.createElement(tag) as AuthorElement;
  const cleanup = () => root.remove();
  const heard: { event: ModelUpdated; modelAtDispatch: unknown }[] = [];
  let captured = 0;
  // The item player listens on an ancestor in the capture phase, legacy
  // pie-author in the bubble phase.
  root.addEventListener('model.updated', () => captured++, true);
  root.addEventListener('model.updated', (e) => {
    heard.push({ event: e as ModelUpdated, modelAtDispatch: element.model });
  });

  try {
    root.appendChild(element);
    element.model = structuredClone(model);
    if (configuration) element.configuration = structuredClone(configuration);
    await settle();
    // Elements may announce the model they were given; only the edit's event counts.
    heard.length = 0;
    captured = 0;
    await edit(element);

    if (captured > heard.length) {
      fail(tag, ['`model.updated` does not bubble, so legacy pie-author never hears it']);
    }
    if (heard.length !== 1) {
      fail(tag, [`an edit reached an ancestor as ${heard.length} \`model.updated\` events, not 1`]);
    }
    const [{ event, modelAtDispatch }] = heard;
    const update = event.detail?.update as Record<string, unknown> | undefined;
    const problems: string[] = [];

    if (event.target !== element) {
      problems.push('dispatches `model.updated` from an inner node instead of the element');
    }
    if (event.update !== event.detail?.update || event.reset !== event.detail?.reset) {
      problems.push(
        'dispatches a plain CustomEvent; legacy pie-author reads `event.update`, which a `ModelUpdatedEvent` carries'
      );
    }
    if (typeof event.detail?.reset !== 'boolean') {
      problems.push('`detail.reset` is not a boolean');
    }
    if (!update || update.id !== model.id || update.element !== model.element) {
      problems.push(
        "`detail.update` lacks the model's `id` and `element`, which hosts match it by"
      );
    }
    if (modelAtDispatch !== undefined && !sameJson(modelAtDispatch, update)) {
      problems.push('`element.model` does not hold the edit when `model.updated` fires');
    }
    fail(tag, problems);

    return { element, event, cleanup };
  } catch (error) {
    cleanup();
    throw error;
  }
}
