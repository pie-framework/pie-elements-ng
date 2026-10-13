import AuthorComponent from './Author.svelte';

export default (AuthorComponent as unknown as { element: CustomElementConstructor }).element;
