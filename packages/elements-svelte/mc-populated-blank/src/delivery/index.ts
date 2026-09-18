import McPopulatedBlankComponent from './McPopulatedBlank.svelte';
import {
  ModelSetEvent,
  SessionChangedEvent,
  writeSessionInPlace,
} from '@pie-lib/delivery-events-svelte';

function isComplete(model: any, session: any, audioComplete = false): boolean {
  if (!session?.value) return false;
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
    this._model = m;
    this.audioComplete = false;
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
    super.session = updatedSession;
    this._dispatchSessionChanged();
  };

  onAudioStarted = () => {
    this._writeSession({
      ...(this._internalSession || {}),
      audioStartTime: Date.now(),
    });
  };

  onAudioEnded = () => {
    this.audioComplete = true;
    this._writeSession({
      ...(this._internalSession || {}),
      audioEndTime: Date.now(),
    });
    this._dispatchSessionChanged();
  };

  _writeSession = (updatedSession: any) => {
    writeSessionInPlace(this._playerSession, updatedSession);
    this._internalSession = updatedSession;
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
