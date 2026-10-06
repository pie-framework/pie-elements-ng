// @ts-nocheck

import { green, indigo, orange, pink, red } from '@mui/material/colors';

export const defaults = {
  TEXT: 'black',
  DISABLED: 'grey',
  DISABLED_SECONDARY: '#ABABAB',
  DISABLED_TEXT: '#545454', // for text that is disabled but still has to be read - a non-editable label
  CORRECT: green[500],
  CORRECT_SECONDARY: green[50],
  CORRECT_TERTIARY: '#0EA449',
  CORRECT_WITH_ICON: '#087D38',
  INCORRECT: orange[500],
  INCORRECT_SECONDARY: red[50],
  INCORRECT_WITH_ICON: '#BF0D00',
  MISSING: red[700],
  MISSING_WITH_ICON: '#6A78A1',
  PRIMARY: indigo[500],
  PRIMARY_LIGHT: indigo[200],
  PRIMARY_DARK: indigo[800],
  SECONDARY: pink.A400,
  SECONDARY_LIGHT: pink[200],
  SECONDARY_DARK: pink[900],
  TERTIARY: '#146EB3',
  TERTIARY_LIGHT: '#D0E2F0',
  BACKGROUND: 'rgba(255,255,255,0)',
  BACKGROUND_DARK: '#ECEDF1',
  // hover/selected fill - inline-dropdown menu items, its authoring toolbar, graphing's
  // selected tools. Not the dropdown menu's own background: the menu paper reads BACKGROUND.
  DROPDOWN_BACKGROUND: '#E0E1E6',
  // this is only used for multi-trait-rubric, we might want to use BACKGROUND_DARK instead
  SECONDARY_BACKGROUND: 'rgba(241,241,241,1)',
  // raised surface for cards, answer pools, and menus;
  SURFACE: '#EBECF1',
  BORDER: '#9A9A9A',
  BORDER_LIGHT: '#D1D1D1',
  BORDER_DARK: '#66686A',
  BORDER_GRAY: '#7E8494',
  // these are used for authored tables
  TABLE_GRID: 'black',
  TABLE_GRID_LIGHT: '#dfe2e5',
  TABLE_STRIPE: '#f6f8fa',
  BLACK: '#000000',
  WHITE: '#ffffff',
  TRANSPARENT: 'transparent',
  // this is used for multiple-choice accessibility
  FOCUS_CHECKED: '#BBDEFB',
  FOCUS_CHECKED_BORDER: '#1565C0',
  FOCUS_UNCHECKED: '#E0E0E0',
  FOCUS_UNCHECKED_BORDER: '#757575',
  // the keyboard focus ring on a button or toolbar control
  BUTTON_FOCUS_OUTLINE: '#3B82F6',
  // this is used for select text tokens
  BLUE_GREY100: '#F3F5F7',
  BLUE_GREY300: '#81848F',
  BLUE_GREY600: '#7E8494',
  BLUE_GREY900: '#152452',
  // this is used for charting
  FADED_PRIMARY: '#DCDAFB',
  // these are used for the math keypad buttons
  KEYPAD_BUTTON: 'rgb(188, 194, 229)',
  KEYPAD_BUTTON_OPERATOR: 'rgb(255, 159, 192)',
  KEYPAD_EMPTY_PLACEHOLDER: 'rgba(245, 0, 87, 0.4)',
  KEYPAD_BUTTON_HOVER: 'rgb(214, 218, 239)',
  KEYPAD_BUTTON_OPERATOR_HOVER: 'rgb(255, 197, 217)',
  // the editable-html formatting toolbar
  EDITOR_TOOLBAR: '#efefef',
  // these are used for graphing UI elements
  BUTTON_BORDER: 'rgba(0, 0, 0, 0.23)',
  BUTTON_HOVER_BG: 'rgba(0, 0, 0, 0.08)',
};

Object.freeze(defaults);

export const v =
  (prefix) =>
  (...args) => {
    const fallback = args.pop();
    return args.reduceRight((acc, v) => {
      return `var(--${prefix}-${v}, ${acc})`;
    }, fallback);
  };

const pv = v('pie');

export const text = () => pv('text', defaults.TEXT);
export const disabled = () => pv('disabled', defaults.DISABLED);
export const disabledSecondary = () => pv('disabled-secondary', defaults.DISABLED_SECONDARY);
export const disabledText = () => pv('disabled-text', 'text', defaults.DISABLED_TEXT);
export const correct = () => pv('correct', defaults.CORRECT);
export const correctSecondary = () => pv('correct-secondary', defaults.CORRECT_SECONDARY);
export const correctTertiary = () => pv('correct-tertiary', defaults.CORRECT_TERTIARY);
export const correctWithIcon = () => pv('correct-icon', defaults.CORRECT_WITH_ICON);
export const incorrect = () => pv('incorrect', defaults.INCORRECT);
export const incorrectWithIcon = () => pv('incorrect-icon', defaults.INCORRECT_WITH_ICON);
export const incorrectSecondary = () => pv('incorrect-secondary', defaults.INCORRECT_SECONDARY);
export const missing = () => pv('missing', defaults.MISSING);
export const missingWithIcon = () => pv('missing-icon', defaults.MISSING_WITH_ICON);

export const primary = () => pv('primary', defaults.PRIMARY);
export const primaryLight = () => pv('primary-light', defaults.PRIMARY_LIGHT);
export const primaryDark = () => pv('primary-dark', defaults.PRIMARY_DARK);
export const primaryText = () => pv('primary-text', 'text', defaults.TEXT);
export const fadedPrimary = () => pv('faded-primary', defaults.FADED_PRIMARY);

export const secondary = () => pv('secondary', defaults.SECONDARY);
export const secondaryLight = () => pv('secondary-light', defaults.SECONDARY_LIGHT);
export const secondaryDark = () => pv('secondary-dark', defaults.SECONDARY_DARK);

export const secondaryText = () => pv('secondary-text', 'text', defaults.TEXT);
export const background = () => pv('background', defaults.BACKGROUND);
export const backgroundDark = () => pv('background-dark', defaults.BACKGROUND_DARK);
export const secondaryBackground = () => pv('secondary-background', defaults.SECONDARY_BACKGROUND);
export const dropdownBackground = () => pv('dropdown-background', defaults.DROPDOWN_BACKGROUND);
export const surface = () => pv('surface', defaults.SURFACE);

export const tertiary = () => pv('tertiary', defaults.TERTIARY);
export const tertiaryLight = () => pv('tertiary-light', defaults.TERTIARY_LIGHT);

export const border = () => pv('border', defaults.BORDER);
export const borderLight = () => pv('border-light', defaults.BORDER_LIGHT);
export const borderDark = () => pv('border-dark', defaults.BORDER_DARK);
export const borderGray = () => pv('border-gray', defaults.BORDER_GRAY);

export const tableGrid = () => pv('table-grid', 'text', defaults.TABLE_GRID);
export const tableGridLight = () => pv('table-grid-light', 'border-light', defaults.TABLE_GRID_LIGHT);
export const tableStripe = () => pv('table-stripe', 'background-dark', defaults.TABLE_STRIPE);

export const black = () => pv('black', defaults.BLACK);
export const white = () => pv('white', defaults.WHITE);
export const transparent = () => defaults.TRANSPARENT;

export const focusChecked = () => pv('focus-checked', defaults.FOCUS_CHECKED);
export const focusCheckedBorder = () => pv('focus-checked-border', defaults.FOCUS_CHECKED_BORDER);
export const focusUnchecked = () => pv('focus-unchecked', defaults.FOCUS_UNCHECKED);
export const focusUncheckedBorder = () => pv('focus-unchecked-border', defaults.FOCUS_UNCHECKED_BORDER);
export const buttonFocusOutline = () => pv('button-focus-outline', defaults.BUTTON_FOCUS_OUTLINE);
// The focus ring chain from THEMING.md. Its first link, focus-outline, is planned and no scheme
// defines it yet, so it falls through to the registered button and checked-border focus tokens. One
// line, so tests/pie-token-contract.test.ts sees the tokens it reads.
export const focusOutline = () => pv('focus-outline', 'button-focus-outline', 'focus-checked-border', defaults.FOCUS_CHECKED_BORDER);
/** @deprecated The keyboard focus ring is {@link focusOutline}. */
export const keyBoardFocusIndicator = focusOutline;

export const blueGrey100 = () => pv('blue-grey-100', defaults.BLUE_GREY100);
export const blueGrey300 = () => pv('blue-grey-300', defaults.BLUE_GREY300);
export const blueGrey600 = () => pv('blue-grey-600', defaults.BLUE_GREY600);
export const blueGrey900 = () => pv('blue-grey-900', defaults.BLUE_GREY900);

const channels = (literal) => {
  const hex = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(literal);
  return hex ? hex.slice(1).map((h) => parseInt(h, 16)) : literal.match(/\d+/g).slice(0, 3).map(Number);
};

/**
 * A fill authored for a white page, re-expressed as `share` of a hue mixed into --pie-background.
 * The hue is solved so that the mix over white is `literal` exactly: a white or absent background
 * renders `literal`, and a dark scheme darkens the fill along with its background, so the scheme's
 * light ink stays legible on it. `share` is a power of two so the solved hue is whole.
 */
const overBackground = (literal, share) => {
  const hue = channels(literal).map((c) => (c - 255 * (1 - share)) / share);
  return `color-mix(in srgb, rgb(${hue.join(' ')}) ${share * 100}%, ${pv('background', defaults.WHITE)})`;
};

// Hover keeps half the rest share, so it moves towards the background under every scheme.
export const keypadButton = () => pv('keypad-button', overBackground(defaults.KEYPAD_BUTTON, 0.5));
export const keypadButtonOperator = () =>
  pv('keypad-button-operator', overBackground(defaults.KEYPAD_BUTTON_OPERATOR, 0.5));
export const keypadEmptyPlaceholder = () => pv('keypad-empty-placeholder', defaults.KEYPAD_EMPTY_PLACEHOLDER);
export const keypadButtonHover = () => pv('keypad-button-hover', overBackground(defaults.KEYPAD_BUTTON_HOVER, 0.25));
export const keypadButtonOperatorHover = () =>
  pv('keypad-button-operator-hover', overBackground(defaults.KEYPAD_BUTTON_OPERATOR_HOVER, 0.25));
// 12.5% keeps the toolbar's grey rest icons above 3:1 under a dark background.
export const editorToolbar = () => overBackground(defaults.EDITOR_TOOLBAR, 0.125);
export const buttonBorder = () => pv('button-border', defaults.BUTTON_BORDER);
export const buttonHoverBg = () => pv('button-hover-bg', defaults.BUTTON_HOVER_BG);

export const visualElementsColors = {
  AXIS_LINE_COLOR: '#5A53C9',
  ROLLOVER_FILL_BAR_COLOR: '#050F2D',
  GRIDLINES_COLOR: '#8E88EA',
  PLOT_FILL_COLOR: '#1463B3',
  SHAPES_FILL_COLOR: '#7986cb',
};
