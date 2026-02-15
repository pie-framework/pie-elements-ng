import AuthorComponent from './Author.svelte';

const SvelteElementClass = (AuthorComponent as any).element;

class SimpleClozeAuthor extends SvelteElementClass {
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
    (this as any).onChange = fn;
  }

  get onChange() {
    return this._onChange || (() => {});
  }
}

export default SimpleClozeAuthor;
