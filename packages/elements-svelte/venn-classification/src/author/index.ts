import { ModelUpdatedEvent } from '@pie-element/shared-configure-events';
import AuthorComponent from './Author.svelte';

const SvelteElementClass = (AuthorComponent as any).element;

class VennClassificationAuthor extends SvelteElementClass {
  private _model: any = null;
  private _onChange: ((model: any) => void) | null = null;

  set model(m: any) {
    this._model = m;
    super.model = m;
  }

  get model() {
    return this._model;
  }

  set onChange(fn: (model: any) => void) {
    this._onChange = fn;
  }

  get onChange() {
    return this._onChange || (() => {});
  }

  /**
   * The component reports each edit here. The host keeps the edited model,
   * renders from it, and announces it as `model.updated`, which bubbles to
   * the listener an authoring player registers at its root.
   */
  onModelChange = (update: any) => {
    this._model = update;
    super.model = update;
    this._onChange?.(update);
    this.dispatchEvent(new ModelUpdatedEvent(update, false));
  };
}

export default VennClassificationAuthor;
