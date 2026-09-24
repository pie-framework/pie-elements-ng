import { ModelUpdatedEvent } from '@pie-element/shared-configure-events';
import AuthorComponent from './Author.svelte';
import type { VideoStimulusModel } from '../types.js';

type GeneratedElementConstructor = new () => HTMLElement & {
  connectedCallback(): void;
};

// Svelte's generated custom-element constructor is runtime-only; keep the
// unavoidable cast constrained to the declared public author properties.
const GeneratedElement = (AuthorComponent as unknown as { element: GeneratedElementConstructor })
  .element;

class VideoStimulusAuthorElement extends GeneratedElement {
  private currentModel: VideoStimulusModel | undefined;
  private changeHandler: ((model: VideoStimulusModel) => void) | undefined;

  set model(nextModel: VideoStimulusModel | undefined) {
    this.currentModel = nextModel;
    // @ts-expect-error Svelte's generated HTMLElement subclass has an untyped model accessor.
    super.model = nextModel;
  }

  get model(): VideoStimulusModel | undefined {
    return this.currentModel;
  }

  set onChange(handler: ((model: VideoStimulusModel) => void) | undefined) {
    this.changeHandler = handler;
  }

  get onChange(): ((model: VideoStimulusModel) => void) | undefined {
    return this.changeHandler;
  }

  /**
   * The component reports each edit here. The host keeps the edited model, renders
   * from it, and announces it as `model.updated`, which bubbles to the listener an
   * authoring player registers at its root.
   */
  onModelChange = (update: VideoStimulusModel): void => {
    this.currentModel = update;
    // @ts-expect-error Svelte's generated HTMLElement subclass has an untyped model accessor.
    super.model = update;
    this.changeHandler?.(update);
    this.dispatchEvent(new ModelUpdatedEvent(update, false));
  };

  connectedCallback(): void {
    super.connectedCallback();
    if (this.currentModel !== undefined) {
      // @ts-expect-error Svelte's generated HTMLElement subclass has an untyped model accessor.
      super.model = this.currentModel;
    }
  }
}

export { AuthorComponent };
export default VideoStimulusAuthorElement;
