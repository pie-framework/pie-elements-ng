/**
 * Building blocks of an element's authoring configuration: the object a host passes to the
 * `<tag>-config` custom element to decide which settings the author sees and how editors behave.
 *
 * Each element declares its own `<Name>Configuration` interface from these, and its JSON Schema is
 * generated from that interface. Descriptions are carried over from the legacy `pie-elements`
 * config schemas, so they appear in the generated schemas unchanged.
 */

export interface ConfigureProp {
  /** Indicates if the item has to be displayed in the Settings Panel */
  settings?: boolean;
  /** Indicates the label for the item that has to be displayed in the Settings Panel */
  label?: string;
}

export interface ConfigurePropWithEnabled extends ConfigureProp {
  /**
   * Indicates the value of the item if it affects config-ui
   * (eg.: if item is a switch and displaying an input on the config-ui depends on the switch value: on/off)
   */
  enabled?: boolean;
}

export interface EditableHtmlButtonConfigure {
  /** Indicates if the plugin is disabled or not */
  disabled?: boolean;
}

export interface CustomPlugin {
  /**
   * The name of the custom event. It needs to be valid (only letters, numbers and "_" can be used).
   * The event is emitted with the "PIE-" prefix.
   */
  event: string;
  /** The alt for the custom button icon */
  iconAlt: string;
  /** The icon type. Currently, only "SVG" is supported. */
  iconType: string;
  /** The icon string. Currently, only SVG is supported, so it needs to be a valid svg. */
  icon: string;
}

/** Toolbar plugins of an editable-html field, keyed by plugin name. */
export interface EditableHtmlConfigureProp {
  math?: EditableHtmlButtonConfigure;
  audio?: EditableHtmlButtonConfigure;
  video?: EditableHtmlButtonConfigure;
  image?: EditableHtmlButtonConfigure;
  /**
   * An array of objects that determine custom plugins.
   * A custom plugin is an object which determines how the button will look like (icon) and the event
   * name that will be triggered when the button gets pressed (event).
   */
  customPlugins?: CustomPlugin[];
  blockquote?: EditableHtmlButtonConfigure;
  h3?: EditableHtmlButtonConfigure;
  characters?: EditableHtmlButtonConfigure;
  bold?: EditableHtmlButtonConfigure;
  html?: EditableHtmlButtonConfigure;
  italic?: EditableHtmlButtonConfigure;
  ol_list?: EditableHtmlButtonConfigure;
  redo?: EditableHtmlButtonConfigure;
  strikethrough?: EditableHtmlButtonConfigure;
  sub?: EditableHtmlButtonConfigure;
  sup?: EditableHtmlButtonConfigure;
  table?: EditableHtmlButtonConfigure;
  ul_list?: EditableHtmlButtonConfigure;
  underline?: EditableHtmlButtonConfigure;
  undo?: EditableHtmlButtonConfigure;
  textAlign?: EditableHtmlButtonConfigure;
  showParagraphs?: EditableHtmlButtonConfigure;
  separateParagraphs?: EditableHtmlButtonConfigure;
  pasteFormatting?: EditableHtmlButtonConfigure;
  superscript?: EditableHtmlButtonConfigure;
  subscript?: EditableHtmlButtonConfigure;
  languageCharacters?: EditableHtmlButtonConfigure;
  responseArea?: EditableHtmlButtonConfigure;
}

export interface EditableHtmlPluginConfigure extends ConfigureProp {
  /** Configuration for editable-html */
  inputConfiguration?: EditableHtmlConfigureProp;
}

export interface EditableHtmlPluginConfigureRequired extends EditableHtmlPluginConfigure {
  /** Indicates if the item is required and the value cannot be empty */
  required?: boolean;
}

/** Maximum image dimensions per editable field. Elements extend it with their own fields. */
export interface ConfigureMaxImageDimensionsProp {
  /** Indicates the max dimension for images in teacher instructions */
  teacherInstructions?: number;
  /**
   * Indicates the max dimension for images in prompt - this is also the default dimension for all
   * other input fields if it's not specified
   */
  prompt?: number;
  /** Indicates the max dimension for images in rationale */
  rationale?: number;
}

export interface ConfigureMathMLProp {
  /** Indicates if model should have mathML output instead of latex */
  mmlOutput?: boolean;
  /** Indicates if mathML that's already in model should be editable */
  mmlEditing?: boolean;
}

export interface ConfigureLanguageOptionsProp {
  /** Value of the language option */
  value: string;
  /** Label of the language option */
  label: string;
}

export interface ConfigureLanguageOptions {
  label: string;
  options: ConfigureLanguageOptionsProp[];
}

/**
 * Indicates the dimensions configuration for the authoring container.
 * Note: Some items have a default minimum width because of their content, but if a lower minWidth is
 * provided, it will be used.
 */
export interface ContentDimensions {
  maxHeight?: string | number;
  maxWidth?: string | number;
  minHeight?: string | number;
  minWidth?: string | number;
}

/** Settings every configuration may carry; `validate()` receives them. */
export interface CommonConfigSettings {
  /** Disable the settings panel */
  settingsPanelDisabled?: boolean;
  spellCheck?: ConfigurePropWithEnabled;
  maxImageWidth?: ConfigureMaxImageDimensionsProp;
  maxImageHeight?: ConfigureMaxImageDimensionsProp;
  withRubric?: ConfigureProp;
  language?: ConfigurePropWithEnabled;
  languageChoices?: ConfigureLanguageOptions;
}
