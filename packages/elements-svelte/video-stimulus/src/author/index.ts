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
    // @ts-expect-error Svelte exposes component props as untyped generated accessors.
    super.onChange = handler;
  }

  get onChange(): ((model: VideoStimulusModel) => void) | undefined {
    return this.changeHandler;
  }

  connectedCallback(): void {
    super.connectedCallback();
    if (this.currentModel !== undefined) {
      // @ts-expect-error Svelte's generated HTMLElement subclass has an untyped model accessor.
      super.model = this.currentModel;
    }
    if (this.changeHandler !== undefined) {
      // @ts-expect-error Svelte exposes component props as untyped generated accessors.
      super.onChange = this.changeHandler;
    }
  }
}

export { AuthorComponent };
export default VideoStimulusAuthorElement;
