import Translator from '@pie-lib/translator';

const { translator } = Translator;

/** The key naming each toolbar tool, by tool type. */
const TOOL_KEYS: Readonly<Record<string, string>> = {
  Select: 'drawingResponse.toolSelect',
  FreePathDrawable: 'drawingResponse.toolFreeDraw',
  LineDrawable: 'drawingResponse.toolLine',
  RectangleDrawable: 'drawingResponse.toolRectangle',
  CircleDrawable: 'drawingResponse.toolCircle',
  Text: 'drawingResponse.toolTextEntry',
  EraserDrawable: 'drawingResponse.toolEraser',
};

export interface DrawingAreaLabelInput {
  hasBackgroundImage: boolean;
  /** Types of the tools the student can draw with; empty when drawing is disabled. */
  toolTypes: readonly string[];
  language?: string;
}

/**
 * Names the drawing canvas from what the item configures: whether it sits over a background
 * image, and the tools available. The image content itself is not described; only an author knows it.
 */
export function labelDrawingArea({ hasBackgroundImage, toolTypes, language }: DrawingAreaLabelInput): string {
  const options = { lng: language, interpolation: { escapeValue: false } };
  const area = translator.t(
    hasBackgroundImage ? 'drawingResponse.drawingAreaOverImage' : 'drawingResponse.drawingArea',
    options,
  );
  const tools = toolTypes.flatMap((type) => (TOOL_KEYS[type] ? [translator.t(TOOL_KEYS[type], options)] : []));

  return tools.length
    ? `${area} ${translator.t('drawingResponse.drawingTools', { ...options, tools: tools.join(', ') })}`
    : area;
}

/** Gives every canvas under `container` (Konva creates one per layer) the image role and `label`. */
export function labelCanvases(container: Element | null | undefined, label: string): void {
  for (const canvas of container?.querySelectorAll('canvas') ?? []) {
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', label);
  }
}
