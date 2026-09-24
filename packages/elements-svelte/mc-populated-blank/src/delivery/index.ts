import McPopulatedBlankComponent from './McPopulatedBlank.svelte';
import { defineDeliveryElement } from '@pie-lib/delivery-events-svelte';
import type { McpbQuestion, McpbSession } from '../shared/types.js';

const DeliveryElement = defineDeliveryElement<McpbQuestion, McpbSession>(
  McPopulatedBlankComponent,
  { isComplete: (_model, session) => !!session?.choiceId }
);

/** Autoplayed audio the learner must hear to the end before a pick counts as complete. */
function requiresAudioCompletion(model: McpbQuestion | undefined): boolean {
  return !!model?.autoplayAudioEnabled && !!model?.completeAudioEnabled && !!model?.hasAudio;
}

class McPopulatedBlankElement extends DeliveryElement {
  audioComplete = false;
  declare onAudioStarted: () => void;
  declare onAudioEnded: () => void;

  constructor() {
    super();
    this.onAudioStarted = () => {
      this.#writeAudioTiming({ audioStartTime: Date.now() });
    };
    this.onAudioEnded = () => {
      this.audioComplete = true;
      this.#writeAudioTiming({ audioEndTime: Date.now() });
      this.dispatchSessionChanged();
    };
  }

  set model(m: McpbQuestion | undefined) {
    // Autoplay re-fires only for a new `audioUrl`, so a re-set of the same
    // model must keep a finished playback counted.
    if (m?.audioUrl !== this.model?.audioUrl) this.audioComplete = false;
    super.model = m;
  }

  get model(): McpbQuestion | undefined {
    return super.model;
  }

  isComplete(): boolean {
    return super.isComplete() && (this.audioComplete || !requiresAudioCompletion(this.model));
  }

  /**
   * The first playback's timing, as multiple-choice's `updateSessionMetadata`
   * records it: a replay does not move either timestamp, and `waitTime` is set
   * once both exist. It reaches the component too, which builds the learner's
   * next pick from the session it renders.
   */
  #writeAudioTiming(timing: { audioStartTime?: number; audioEndTime?: number }) {
    const session: McpbSession = this.session || {};
    const audioStartTime = session.audioStartTime || timing.audioStartTime;
    const audioEndTime = session.audioEndTime || timing.audioEndTime;
    const next: McpbSession = {
      ...session,
      ...(audioStartTime ? { audioStartTime } : {}),
      ...(audioEndTime ? { audioEndTime } : {}),
    };
    if (!next.waitTime && audioStartTime && audioEndTime) {
      next.waitTime = audioEndTime - audioStartTime;
    }
    this.writeSession(next);
  }
}

export default McPopulatedBlankElement;
