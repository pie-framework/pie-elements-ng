import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { Editor } from '@tiptap/core';
import Document from '@tiptap/extension-document';
import Text from '@tiptap/extension-text';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';

const lowlight = createLowlight(common);

@customElement('json-editor')
export class JsonEditor extends LitElement {
  static override styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .editor-container {
      width: 100%;
      height: 100%;
      border: 1px solid #e5e7eb;
      border-radius: 0.375rem;
      overflow: hidden;
      background: #1f2937;
    }

    .tiptap {
      padding: 1rem;
      height: 100%;
      overflow: auto;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 0.875rem;
      line-height: 1.5;
      color: #e5e7eb;
    }

    .tiptap:focus {
      outline: none;
    }

    /* Syntax highlighting - filter-based approach from pie-qti */
    .tiptap pre {
      margin: 0;
      padding: 0;
      background: transparent;
    }

    .tiptap code {
      display: block;
      white-space: pre;
      background: transparent;
      color: inherit;
    }

    /* Lowlight/highlight.js classes with filter-based coloring */
    .tiptap .hljs-attr {
      filter: sepia(100%) saturate(300%) hue-rotate(180deg);
    }

    .tiptap .hljs-string {
      filter: sepia(100%) saturate(300%) hue-rotate(60deg);
    }

    .tiptap .hljs-number,
    .tiptap .hljs-literal {
      filter: sepia(100%) saturate(300%) hue-rotate(280deg);
    }

    .tiptap .hljs-name,
    .tiptap .hljs-tag {
      filter: sepia(100%) saturate(300%) hue-rotate(200deg);
    }

    .tiptap .hljs-punctuation {
      color: #9ca3af;
    }

    .tiptap .hljs-keyword {
      filter: sepia(100%) saturate(300%) hue-rotate(310deg);
    }
  `;

  @property({ type: String })
  value = '';

  @property({ type: Boolean })
  readOnly = false;

  @state()
  private editor?: Editor;

  override firstUpdated() {
    const container = this.shadowRoot?.querySelector('.tiptap');
    if (!container) return;

    this.editor = new Editor({
      element: container as HTMLElement,
      extensions: [
        Document,
        Text,
        CodeBlockLowlight.configure({
          lowlight,
          defaultLanguage: 'json',
        }),
      ],
      content: this.formatContent(this.value),
      editable: !this.readOnly,
      onUpdate: ({ editor }) => {
        const text = editor.getText();
        this.dispatchEvent(
          new CustomEvent('change', {
            detail: { value: text },
            bubbles: true,
            composed: true,
          })
        );
      },
    });
  }

  override updated(changedProperties: Map<string, any>) {
    if (changedProperties.has('value') && this.editor) {
      const currentText = this.editor.getText();
      if (currentText !== this.value) {
        this.editor.commands.setContent(this.formatContent(this.value));
      }
    }

    if (changedProperties.has('readOnly') && this.editor) {
      this.editor.setEditable(!this.readOnly);
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.editor?.destroy();
  }

  private formatContent(content: string): string {
    // Wrap in pre/code for CodeBlockLowlight
    return `<pre><code class="language-json">${this.escapeHtml(content)}</code></pre>`;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  override render() {
    return html`
      <div class="editor-container">
        <div class="tiptap"></div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'json-editor': JsonEditor;
  }
}
