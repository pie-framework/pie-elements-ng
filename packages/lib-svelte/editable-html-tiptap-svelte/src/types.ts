export type EditableHtmlProps = {
  markup?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  showToolbar?: boolean;
  disabled?: boolean;
};
