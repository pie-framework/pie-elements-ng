import McPopulatedBlankComponent from './McPopulatedBlank.svelte';
import { defineDeliveryElement } from '@pie-lib/delivery-events-svelte';
import type { McPopulatedBlankModel, McPopulatedBlankSession } from '../types.js';
import { selectedChoiceId } from '../shared/session.js';

const DeliveryElement = defineDeliveryElement<McPopulatedBlankModel, McPopulatedBlankSession>(
  McPopulatedBlankComponent,
  { isComplete: (_model, session) => !!selectedChoiceId(session) }
);

/**
 * Audio the learner must hear to the end before a pick counts as complete,
 * whether autoplay or the learner started it. An item declaring audio without
 * an `audioUrl` has none to hear.
 */
function requiresAudioCompletion(model: McPopulatedBlankModel | undefined): boolean {
  return !!model?.completeAudioEnabled && !!model?.hasAudio && !!model?.audioUrl;
}

class McPopulatedBlankElement extends DeliveryElement {
  audioComplete = false;
  /** The audio could not load, so completion no longer waits on it. */
  audioFailed = false;
  declare onAudioStarted: () => void;
  declare onAudioEnded: () => void;
  declare onAudioFailed: () => void;

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
    this.onAudioFailed = () => {
      this.audioFailed = true;
      this.dispatchSessionChanged();
    };
  }

  set model(m: McPopulatedBlankModel | undefined) {
    // Autoplay re-fires only for a new `audioUrl`, so a re-set of the same
    // model must keep a finished playback counted.
    if (m?.audioUrl !== this.model?.audioUrl) {
      this.audioComplete = false;
      this.audioFailed = false;
    }
    super.model = m;
  }

  get model(): McPopulatedBlankModel | undefined {
    return super.model;
  }

  isComplete(): boolean {
    // A resumed session keeps `audioEndTime` from the playback that finished.
    const audioSettled = this.audioComplete || this.audioFailed || !!this.session?.audioEndTime;
    return super.isComplete() && (audioSettled || !requiresAudioCompletion(this.model));
  }

  /**
   * The first playback's timing, as multiple-choice's `updateSessionMetadata`
   * records it: a replay does not move either timestamp, and `waitTime` is set
   * once both exist. It reaches the component too, which builds the learner's
   * next pick from the session it renders.
   */
  #writeAudioTiming(timing: { audioStartTime?: number; audioEndTime?: number }) {
    const session: McPopulatedBlankSession = this.session || {};
    const audioStartTime = session.audioStartTime || timing.audioStartTime;
    const audioEndTime = session.audioEndTime || timing.audioEndTime;
    const next: McPopulatedBlankSession = {
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
