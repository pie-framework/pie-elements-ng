import { ModelSetEvent } from '@pie-lib/delivery-events-svelte';
import VideoStimulusComponent from './VideoStimulus.svelte';
import type { VideoStimulusViewModel } from '../types.js';

type GeneratedElementConstructor = new () => HTMLElement & {
  connectedCallback(): void;
};

// Svelte exposes `.element` at runtime for custom-element builds but does not
// provide a stable constructor type for extending the generated class.
const GeneratedElement = (
  VideoStimulusComponent as unknown as { element: GeneratedElementConstructor }
).element;

class VideoStimulusElement extends GeneratedElement {
  private currentModel: VideoStimulusViewModel | undefined;

  set model(nextModel: VideoStimulusViewModel | undefined) {
    this.currentModel = nextModel;
    // @ts-expect-error Svelte's generated HTMLElement subclass has an untyped model accessor.
    super.model = nextModel;
    if (nextModel?.language) this.lang = nextModel.language;
    this.dispatchEvent(
      new ModelSetEvent(this.tagName.toLowerCase(), true, nextModel !== undefined)
    );
  }

  get model(): VideoStimulusViewModel | undefined {
    return this.currentModel;
  }

  connectedCallback(): void {
    super.connectedCallback();
    if (this.currentModel !== undefined) {
      // @ts-expect-error Svelte's generated HTMLElement subclass has an untyped model accessor.
      super.model = this.currentModel;
    }
  }
}

export { VideoStimulusComponent };
export default VideoStimulusElement;
