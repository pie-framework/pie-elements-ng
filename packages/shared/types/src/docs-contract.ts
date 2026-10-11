/**
 * Contracts used by generated PIE documentation tooling.
 */

export type PieElementFramework = 'react' | 'svelte';

export interface PieDocsSourcePointer {
  /**
   * Source file path relative to the element package root.
   */
  file: string;

  /**
   * Export to read from the file. Defaults to `default`.
   */
  exportName?: string;

  /**
   * Dot-delimited path within the exported value.
   * Example: "model" or "configuration.prompt".
   */
  path?: string;
}

export interface PieDocsViewContract {
  /**
   * Logical view id, for example: delivery, author, print.
   */
  view: string;

  /**
   * Source pointer for delivery model defaults.
   */
  pie: PieDocsSourcePointer;

  /**
   * Source pointer for author/configuration defaults.
   */
  config: PieDocsSourcePointer;
}

export interface PieDocsContract {
  /**
   * Globally unique PIE element id.
   * Example: "multiple-choice".
   */
  elementName: string;

  /**
   * npm package name.
   * Example: "@pie-element/multiple-choice".
   */
  packageName: string;

  framework: PieElementFramework;

  /**
   * Optional human summary. Used by Markdown header.
   */
  summary?: string;

  /**
   * Optional supported runtime modes.
   */
  supportedModes?: string[];

  views: PieDocsViewContract[];
}

export interface PieDocsPropertyContract {
  path: string;
  type: string;
  required: boolean;
  defaultValue?: unknown;
  description?: string;
}
