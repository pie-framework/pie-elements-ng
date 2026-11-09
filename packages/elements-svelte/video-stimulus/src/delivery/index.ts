import { subscribeInterfaceLocale } from '@pie-element/shared-i18n';
import { ModelSetEvent } from '@pie-lib/delivery-events-svelte';
import VideoStimulusComponent from './VideoStimulus.svelte';
import type { VideoStimulusViewModel } from '../types.js';

type GeneratedElementConstructor = new () => HTMLElement & {
  connectedCallback(): void;
  disconnectedCallback(): void;
  interfaceLocale?: string;
};

// Svelte exposes `.element` at runtime for custom-element builds but does not
// provide a stable constructor type for extending the generated class.
const GeneratedElement = (
  VideoStimulusComponent as unknown as { element: GeneratedElementConstructor }
).element;

/**
 * While connected, the element follows the locale a player publishes through
 * `interfaceLocaleContext` and hands it to the component's `interfaceLocale`
 * prop, which stays unset with no player.
 */
class VideoStimulusElement extends GeneratedElement {
  private currentModel: VideoStimulusViewModel | undefined;
  private disconnectInterfaceLocale: (() => void) | null = null;

  set model(nextModel: VideoStimulusViewModel | undefined) {
    this.currentModel = nextModel;
    // @ts-expect-error Svelte's generated HTMLElement subclass has an untyped model accessor.
    super.model = nextModel;
    this.dispatchEvent(
      new ModelSetEvent(this.tagName.toLowerCase(), true, nextModel !== undefined)
    );
  }

  get model(): VideoStimulusViewModel | undefined {
    return this.currentModel;
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.disconnectInterfaceLocale ??= subscribeInterfaceLocale(this, (value) => {
      if (value?.locale && value.locale !== this.interfaceLocale) {
        this.interfaceLocale = value.locale;
      }
    });
    if (this.currentModel !== undefined) {
      // @ts-expect-error Svelte's generated HTMLElement subclass has an untyped model accessor.
      super.model = this.currentModel;
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.disconnectInterfaceLocale?.();
    this.disconnectInterfaceLocale = null;
  }
}

export default VideoStimulusElement;
