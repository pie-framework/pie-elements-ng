import McPopulatedBlankComponent from './McPopulatedBlank.svelte';
import {
  ModelSetEvent,
  SessionChangedEvent,
  writeSessionInPlace,
} from '@pie-lib/delivery-events-svelte';

function isComplete(model: any, session: any, audioComplete = false): boolean {
  if (!session?.choiceId) return false;
  const requiresAudioCompletion =
    !!model?.autoplayAudioEnabled && !!model?.completeAudioEnabled && !!model?.hasAudio;
  if (requiresAudioCompletion && !audioComplete) return false;
  return true;
}

const SvelteElementClass = (McPopulatedBlankComponent as any).element;

class McPopulatedBlankElement extends SvelteElementClass {
  _internalSession: any = null;
  /**
   * The session object the player handed us. A player reads the learner's
   * response back off this object, so every update is written into it as well
   * as into the copy the component renders from.
   */
  _playerSession: any = null;
  _model: any = null;
  _options: any = null;
  audioComplete = false;

  _dispatchModelSet = () => {
    this.dispatchEvent(
      new ModelSetEvent(this.tagName.toLowerCase(), this._isComplete(), this._model !== undefined)
    );
  };

  _dispatchSessionChanged = () => {
    this.dispatchEvent(new SessionChangedEvent(this.tagName.toLowerCase(), this._isComplete()));
  };

  set model(m: any) {
    // Autoplay re-fires only for a new `audioUrl`, so a re-set of the same
    // model must keep a finished playback counted.
    if (m?.audioUrl !== this._model?.audioUrl) this.audioComplete = false;
    this._model = m;
    super.model = m;
    this._dispatchModelSet();
  }

  get model() {
    return this._model;
  }

  set session(s: any) {
    this._playerSession = s;
    this._internalSession = s;
    super.session = s;
    this._dispatchSessionChanged();
  }

  get session() {
    return this._internalSession;
  }

  set options(o: any) {
    this._options = o;
    super.options = o;
  }

  get options() {
    return this._options;
  }

  onSessionChange = (updatedSession: any) => {
    this._writeSession(updatedSession);
    this._dispatchSessionChanged();
  };

  onAudioStarted = () => {
    this._writeAudioTiming({ audioStartTime: Date.now() });
  };

  onAudioEnded = () => {
    this.audioComplete = true;
    this._writeAudioTiming({ audioEndTime: Date.now() });
    this._dispatchSessionChanged();
  };

  /**
   * The first playback's timing, as multiple-choice's `updateSessionMetadata`
   * records it: a replay does not move either timestamp, and `waitTime` is set
   * once both exist.
   */
  _writeAudioTiming = (timing: { audioStartTime?: number; audioEndTime?: number }) => {
    const session = this._internalSession || {};
    const audioStartTime = session.audioStartTime || timing.audioStartTime;
    const audioEndTime = session.audioEndTime || timing.audioEndTime;
    const next = {
      ...session,
      ...(audioStartTime ? { audioStartTime } : {}),
      ...(audioEndTime ? { audioEndTime } : {}),
    };
    if (!next.waitTime && audioStartTime && audioEndTime) {
      next.waitTime = audioEndTime - audioStartTime;
    }
    this._writeSession(next);
  };

  /**
   * The component builds its next update from the session it renders, and
   * `writeSessionInPlace` drops keys that update lacks, so every write reaches
   * the component too: audio timing written behind its back was erased by the
   * learner's next pick.
   */
  _writeSession = (updatedSession: any) => {
    writeSessionInPlace(this._playerSession, updatedSession);
    this._internalSession = updatedSession;
    super.session = updatedSession;
  };

  _isComplete = () => {
    return isComplete(this._model, this._internalSession, this.audioComplete);
  };

  connectedCallback() {
    super.connectedCallback();
    (this as any).onSessionChange = this.onSessionChange;
    (this as any).onAudioStarted = this.onAudioStarted;
    (this as any).onAudioEnded = this.onAudioEnded;
  }
}

export default McPopulatedBlankElement;
