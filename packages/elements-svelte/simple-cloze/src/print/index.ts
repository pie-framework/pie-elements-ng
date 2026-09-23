import PrintComponent from './Print.svelte';

const SvelteElementClass = (PrintComponent as any).element;

/**
 * Print players set `el.options = config.options` and then `el.model = m`;
 * `options.role` decides whether the answer key is printed.
 */
class SimpleClozePrint extends SvelteElementClass {
  private _model: any = null;
  private _options: any = null;

  set model(m: any) {
    this._model = m;
    super.model = m;
  }

  get model() {
    return this._model;
  }

  set options(o: any) {
    this._options = o;
    super.options = o;
  }

  get options() {
    return this._options;
  }
}

export default SimpleClozePrint;
