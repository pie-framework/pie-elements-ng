import McPopulatedBlankComponent from './McPopulatedBlank.svelte';
import { defineDeliveryElement } from '@pie-lib/delivery-events-svelte';
import type { McPopulatedBlankModel, McPopulatedBlankSession } from '../types.js';
import { selectedChoiceId } from '../shared/session.js';
import { PromptAudioTracker } from '@pie-element/shared-utils';

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
  readonly promptAudio = new PromptAudioTracker<McPopulatedBlankSession>({
    session: () => this.session,
    // Timing reaches the component too, which builds the learner's next pick from the session it renders.
    writeSession: (next) => this.writeSession(next),
    announce: () => this.dispatchSessionChanged(),
  });
  declare onAudioStarted: () => void;
  declare onAudioEnded: () => void;
  declare onAudioFailed: () => void;

  constructor() {
    super();
    this.onAudioStarted = () => this.promptAudio.recordStart();
    this.onAudioEnded = () => this.promptAudio.recordEnd();
    this.onAudioFailed = () => this.promptAudio.recordFailure();
  }

  set model(m: McPopulatedBlankModel | undefined) {
    // Autoplay re-fires only for a new `audioUrl`, so a re-set of the same
    // model must keep a finished playback counted.
    this.promptAudio.follow(m?.audioUrl);
    super.model = m;
  }

  get model(): McPopulatedBlankModel | undefined {
    return super.model;
  }

  isComplete(): boolean {
    return super.isComplete() && !(requiresAudioCompletion(this.model) && this.promptAudio.pending);
  }
}

export default McPopulatedBlankElement;
