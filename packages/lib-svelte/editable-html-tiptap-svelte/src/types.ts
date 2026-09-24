export type EditableHtmlProps = {
  markup?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  showToolbar?: boolean;
  disabled?: boolean;
  /** Accessible name of the text box, for a host whose visible label is not tied to it. */
  ariaLabel?: string;
};
