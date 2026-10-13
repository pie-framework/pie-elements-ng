import { CONTROLLER_MESSAGES, type ControllerMessageKey } from '../controller/messages.js';

export const AUTHOR_MESSAGES = {
  en: {
    heading: 'Video stimulus',
    intro: 'Configure the video, accessible alternatives, and publish declarations.',
    reviewForPublish: 'Review for publish',
    reviewDraft: 'Review draft',
    errorsHeading: 'Fix these blocking issues',
    warningsHeading: 'Review these recommendations',
    basics: 'Basics',
    assetId: 'Asset ID',
    videoLabel: 'Video label',
    description: 'Description',
    mediaLanguage: 'Media language',
    uiLanguage: 'Learner UI language',
    showLabel: 'Show label visually',
    showDescription: 'Show description',
    transcriptInitiallyExpanded: 'Open transcript initially',
    sources: 'Video sources',
    addSource: 'Add source',
    source: 'Source',
    sourceUrl: 'Source URL',
    mimeType: 'MIME type',
    width: 'Width',
    height: 'Height',
    bitrate: 'Bitrate',
    poster: 'Poster',
    posterUrl: 'Poster URL',
    tracks: 'Text tracks',
    tracksHelp:
      'Use captions for dialogue, speakers, and meaningful sounds. Subtitles translate speech only. A descriptions track does not by itself verify spoken audio description.',
    addTrack: 'Add track',
    track: 'Track',
    trackUrl: 'Track URL',
    kind: 'Kind',
    trackKindCaptions: 'Captions',
    trackKindSubtitles: 'Subtitles',
    trackKindDescriptions: 'Descriptions',
    trackKindChapters: 'Chapters',
    trackKindMetadata: 'Metadata',
    language: 'Language',
    label: 'Label',
    defaultTrack: 'Default track',
    transcript: 'Transcript',
    transcriptHelp: 'Delivery uses safe inline HTML first, then plain text, then an external link.',
    transcriptUrl: 'External transcript URL',
    transcriptHtml: 'Inline transcript HTML',
    transcriptPlainText: 'Plain-text transcript',
    transcriptLanguage: 'Transcript language',
    accessibility: 'Accessibility review',
    audioContent: 'Audio content',
    captionSupport: 'Caption support',
    visualSupport: 'Visual support',
    unknown: 'Needs review',
    noMeaningfulAudio: 'No meaningful synchronized audio',
    meaningfulAudio: 'Meaningful synchronized audio',
    captionsNotRequired: 'Captions not required',
    captionsTrack: 'Captions text track',
    openCaptions: 'Open captions in the video',
    captionsMissing: 'Captions missing',
    visualsNotMeaningful: 'No important visual information',
    visualsDescribed: 'Important visuals described in audio',
    visualsMissing: 'Important visuals are not described',
    accessibilityHelp:
      'Manually review caption timing and accuracy, speaker names, meaningful sounds, and audio-description completeness.',
    preview: 'Delivery preview',
    previewHelp: 'The preview updates when a field is committed.',
    moveUp: 'Move up',
    moveDown: 'Move down',
    remove: 'Remove',
    emptySources: 'Add at least one source before publishing.',
    emptyTracks: 'Text tracks are optional. Add captions when synchronized audio is meaningful.',
    splitLabel: 'Resize editor and preview',
  },
  es: {
    heading: 'Estímulo de video',
    intro: 'Configure el video, las alternativas accesibles y las declaraciones de publicación.',
    reviewForPublish: 'Revisar para publicar',
    reviewDraft: 'Revisar borrador',
    errorsHeading: 'Corrija estos problemas obligatorios',
    warningsHeading: 'Revise estas recomendaciones',
    basics: 'Datos básicos',
    assetId: 'ID del recurso',
    videoLabel: 'Etiqueta del video',
    description: 'Descripción',
    mediaLanguage: 'Idioma del contenido',
    uiLanguage: 'Idioma de la interfaz',
    showLabel: 'Mostrar la etiqueta',
    showDescription: 'Mostrar la descripción',
    transcriptInitiallyExpanded: 'Abrir la transcripción al inicio',
    sources: 'Fuentes de video',
    addSource: 'Agregar fuente',
    source: 'Fuente',
    sourceUrl: 'URL de la fuente',
    mimeType: 'Tipo MIME',
    width: 'Ancho',
    height: 'Alto',
    bitrate: 'Tasa de bits',
    poster: 'Póster',
    posterUrl: 'URL del póster',
    tracks: 'Pistas de texto',
    tracksHelp:
      'Use subtítulos descriptivos para el diálogo, los hablantes y los sonidos relevantes. Los subtítulos de traducción solo traducen el habla. Una pista de descripciones no confirma por sí sola una audiodescripción hablada.',
    addTrack: 'Agregar pista',
    track: 'Pista',
    trackUrl: 'URL de la pista',
    kind: 'Tipo',
    trackKindCaptions: 'Subtítulos descriptivos',
    trackKindSubtitles: 'Subtítulos de traducción',
    trackKindDescriptions: 'Descripciones',
    trackKindChapters: 'Capítulos',
    trackKindMetadata: 'Metadatos',
    language: 'Idioma',
    label: 'Etiqueta',
    defaultTrack: 'Pista predeterminada',
    transcript: 'Transcripción',
    transcriptHelp:
      'La entrega usa HTML seguro, luego texto sin formato y después un enlace externo.',
    transcriptUrl: 'URL externa de la transcripción',
    transcriptHtml: 'HTML de la transcripción',
    transcriptPlainText: 'Transcripción en texto sin formato',
    transcriptLanguage: 'Idioma de la transcripción',
    accessibility: 'Revisión de accesibilidad',
    audioContent: 'Contenido de audio',
    captionSupport: 'Subtítulos descriptivos',
    visualSupport: 'Información visual',
    unknown: 'Necesita revisión',
    noMeaningfulAudio: 'Sin audio sincronizado significativo',
    meaningfulAudio: 'Audio sincronizado significativo',
    captionsNotRequired: 'No se requieren subtítulos descriptivos',
    captionsTrack: 'Pista de subtítulos descriptivos',
    openCaptions: 'Subtítulos abiertos en el video',
    captionsMissing: 'Faltan subtítulos descriptivos',
    visualsNotMeaningful: 'Sin información visual importante',
    visualsDescribed: 'La información visual se describe en el audio',
    visualsMissing: 'La información visual importante no está descrita',
    accessibilityHelp:
      'Revise manualmente la sincronización y precisión, los hablantes, los sonidos relevantes y la audiodescripción.',
    preview: 'Vista previa de entrega',
    previewHelp: 'La vista previa se actualiza al confirmar cada campo.',
    moveUp: 'Mover hacia arriba',
    moveDown: 'Mover hacia abajo',
    remove: 'Eliminar',
    emptySources: 'Agregue al menos una fuente antes de publicar.',
    emptyTracks: 'Las pistas son opcionales. Agregue subtítulos cuando el audio sea significativo.',
    splitLabel: 'Cambiar el tamaño del editor y la vista previa',
  },
} as const;

const SPANISH_CONTROLLER_MESSAGES: Readonly<Record<ControllerMessageKey, string>> = Object.freeze({
  accessibilityProfileNotObject: 'El perfil de accesibilidad debe ser un objeto.',
  assetIdRequired: 'Se requiere el ID del recurso.',
  audioContentInvalid: 'Elija necesita revisión, sin audio significativo o audio significativo.',
  audioContentUnresolved: 'Revise si el video contiene audio sincronizado significativo.',
  bitrateInvalid: 'La tasa de bits debe ser un número positivo.',
  blobUrlNotDurable: 'Las URL blob son temporales y no se pueden publicar.',
  captionSupportInvalid:
    'Elija necesita revisión, no se requieren, pista, subtítulos abiertos o faltantes.',
  captionSupportUnresolved:
    'Defina cómo se proporcionan los subtítulos descriptivos antes de publicar.',
  captionsRequired: 'El audio sincronizado significativo requiere subtítulos descriptivos.',
  captionsTrackMissing:
    'La declaración de pista de subtítulos requiere una pista de subtítulos descriptivos completa.',
  durationInvalid: 'La duración debe ser un número positivo de segundos.',
  heightInvalid: 'La altura debe ser un número entero positivo.',
  labelRequired: 'Se requiere la etiqueta del video.',
  labelTooGeneric: 'Use una etiqueta específica que identifique el contenido del video.',
  languageTagInvalid: 'Ingrese una etiqueta de idioma BCP 47 válida.',
  mediaKindNotVideo: 'El tipo de contenido multimedia debe ser «video».',
  mediaLanguageInvalid: 'Ingrese un idioma BCP 47 válido para el contenido.',
  mediaLanguageRequired: 'Se requiere un idioma del contenido válido en formato BCP 47.',
  mediaNotObject: 'El contenido multimedia debe ser un objeto.',
  mediaRequired: 'Se requiere contenido multimedia.',
  mediaUrlUnsafe: 'Ingrese una URL HTTP(S), data, blob o relativa que sea segura.',
  mediaVersionUnsupported: 'La versión del recurso multimedia debe ser 1.',
  modelNotObject: 'El modelo debe ser un objeto.',
  multipleDefaultTracks: 'Solo una pista de texto puede ser la predeterminada.',
  playableSourceRequired: 'Se requiere al menos una fuente de video segura y permanente.',
  reviewAudioDescription:
    'Verifique manualmente que el audio integrado describa cada detalle visual importante.',
  reviewCaptionQuality:
    'Revise manualmente la sincronización y precisión de los subtítulos, la identificación de hablantes y los sonidos relevantes.',
  sourceNotObject: 'La fuente debe ser un objeto con una URL.',
  sourceTypeNotVideo: 'El tipo MIME debe comenzar con «video/».',
  sourceTypeRecommended:
    'Declare el tipo MIME del video para mejorar la selección de fuentes del navegador.',
  sourceTypeUncommon: 'Verifique esta codificación de video en todos los navegadores compatibles.',
  sourceUrlDuplicate: 'Cada URL de fuente debe ser única.',
  sourceUrlRequired: 'Se requiere una URL para la fuente.',
  sourceUrlUnsafe: 'Ingrese una URL HTTP(S), data, blob o relativa para el video que sea segura.',
  sourcesNotArray: 'Las fuentes de video deben ser una matriz.',
  subtitlesAreNotCaptions:
    'Los subtítulos de traducción no incluyen automáticamente hablantes ni sonidos relevantes; agregue subtítulos descriptivos cuando el audio sea significativo.',
  trackDefaultInvalid: 'El valor predeterminado debe ser verdadero o falso.',
  trackKindInvalid:
    'Elija subtítulos descriptivos, subtítulos de traducción, descripciones, capítulos o metadatos.',
  trackLabelRequired: 'Se requiere la etiqueta de la pista.',
  trackNotObject: 'La pista debe ser un objeto.',
  trackUrlDuplicate: 'Cada URL de pista de texto debe ser única.',
  trackUrlRequired: 'Se requiere la URL de la pista.',
  trackUrlUnsafe: 'Ingrese una URL segura para la pista de texto.',
  tracksNotArray: 'Las pistas de texto deben ser una matriz.',
  transcriptContentRequired:
    'Proporcione HTML integrado, texto sin formato o una URL externa para la transcripción.',
  transcriptExternalOnly:
    'La transcripción es solo externa; verifique que el recurso enlazado siga disponible y sea accesible.',
  transcriptHtmlNotText: 'El HTML integrado de la transcripción debe ser texto.',
  transcriptHtmlUnreadable:
    'El HTML integrado de la transcripción debe contener contenido seguro y legible.',
  transcriptNotObject: 'La transcripción debe ser un objeto.',
  transcriptPlainTextNotText: 'El contenido sin formato de la transcripción debe ser texto.',
  transcriptRecommended:
    'Agregue una transcripción para que el contenido siga disponible cuando la reproducción o el acceso auditivo sean limitados.',
  transcriptUrlUnsafe: 'Ingrese una URL HTTP(S) segura o una URL relativa para la transcripción.',
  uiLanguageInvalid: 'Ingrese un idioma BCP 47 válido para la interfaz del estudiante.',
  uiTextNotObject: 'Las sustituciones de texto de la interfaz del estudiante deben ser un objeto.',
  uiTextValueInvalid:
    'Las sustituciones de texto de la interfaz del estudiante deben ser cadenas no vacías.',
  visualSupportInvalid:
    'Elija necesita revisión, sin información importante, descrita o no descrita.',
  visualSupportUnresolved: 'Revise si la información visual importante se describe en el audio.',
  visualsUndescribed:
    'La información visual importante debe describirse en el audio principal o integrado.',
  widthInvalid: 'El ancho debe ser un número entero positivo.',
  unknownUiTextKey: 'Clave de texto desconocida:',
});

export type AuthorLocale = keyof typeof AUTHOR_MESSAGES;
export type AuthorMessageKey = keyof (typeof AUTHOR_MESSAGES)['en'];

export function resolveAuthorLocale(locale: string | undefined): AuthorLocale {
  return locale?.toLowerCase().startsWith('es') ? 'es' : 'en';
}

const CONTROLLER_MESSAGE_KEYS: ReadonlyMap<string, ControllerMessageKey> = new Map(
  (Object.entries(CONTROLLER_MESSAGES) as Array<[ControllerMessageKey, string]>).map(
    ([key, message]) => [message, key]
  )
);

export function localizeAuthorFinding(message: string, locale: AuthorLocale): string {
  if (locale !== 'es') return message;
  const key = CONTROLLER_MESSAGE_KEYS.get(message);
  if (key) return SPANISH_CONTROLLER_MESSAGES[key];
  const unknownKeyPrefix = CONTROLLER_MESSAGES.unknownUiTextKey;
  if (message.startsWith(unknownKeyPrefix)) {
    return `${SPANISH_CONTROLLER_MESSAGES.unknownUiTextKey}${message.slice(unknownKeyPrefix.length)}`;
  }
  return message;
}
