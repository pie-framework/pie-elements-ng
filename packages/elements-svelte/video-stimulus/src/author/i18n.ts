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

const SPANISH_CONTROLLER_MESSAGES: Readonly<Record<string, string>> = Object.freeze({
  'A source URL is required.': 'Se requiere una URL para la fuente.',
  'A valid BCP 47 media language is required.':
    'Se requiere un idioma del contenido válido en formato BCP 47.',
  'Accessibility profile must be an object.': 'El perfil de accesibilidad debe ser un objeto.',
  'Add a transcript so content remains available when playback or hearing access is limited.':
    'Agregue una transcripción para que el contenido siga disponible cuando la reproducción o el acceso auditivo sean limitados.',
  'Asset ID is required.': 'Se requiere el ID del recurso.',
  'At least one safe, durable video source is required.':
    'Se requiere al menos una fuente de video segura y permanente.',
  'Bitrate must be a positive number.': 'La tasa de bits debe ser un número positivo.',
  'Blob URLs are temporary and cannot be published.':
    'Las URL blob son temporales y no se pueden publicar.',
  'Choose captions, subtitles, descriptions, chapters, or metadata.':
    'Elija subtítulos descriptivos, subtítulos de traducción, descripciones, capítulos o metadatos.',
  'Choose unknown, none, or meaningful.':
    'Elija necesita revisión, sin audio significativo o audio significativo.',
  'Choose unknown, not meaningful, described, or missing.':
    'Elija necesita revisión, sin información importante, descrita o no descrita.',
  'Choose unknown, not required, track, open captions, or missing.':
    'Elija necesita revisión, no se requieren, pista, subtítulos abiertos o faltantes.',
  'Declare the video MIME type to improve browser source selection.':
    'Declare el tipo MIME del video para mejorar la selección de fuentes del navegador.',
  'Default must be true or false.': 'El valor predeterminado debe ser verdadero o falso.',
  'Duration must be a positive number of seconds.':
    'La duración debe ser un número positivo de segundos.',
  'Each source URL must be unique.': 'Cada URL de fuente debe ser única.',
  'Each text-track URL must be unique.': 'Cada URL de pista de texto debe ser única.',
  'Enter a safe HTTP(S) or relative transcript URL.':
    'Ingrese una URL HTTP(S) segura o una URL relativa para la transcripción.',
  'Enter a safe HTTP(S), data, blob, or relative media URL.':
    'Ingrese una URL HTTP(S), data, blob o relativa que sea segura.',
  'Enter a safe HTTP(S), data, blob, or relative video URL.':
    'Ingrese una URL HTTP(S), data, blob o relativa para el video que sea segura.',
  'Enter a safe text-track URL.': 'Ingrese una URL segura para la pista de texto.',
  'Enter a valid BCP 47 language tag.': 'Ingrese una etiqueta de idioma BCP 47 válida.',
  'Enter a valid BCP 47 learner UI language.':
    'Ingrese un idioma BCP 47 válido para la interfaz del estudiante.',
  'Enter a valid BCP 47 media language.': 'Ingrese un idioma BCP 47 válido para el contenido.',
  'Height must be a positive whole number.': 'La altura debe ser un número entero positivo.',
  'Important visual information must be described in the main or integrated audio.':
    'La información visual importante debe describirse en el audio principal o integrado.',
  'Inline transcript HTML must be text.': 'El HTML integrado de la transcripción debe ser texto.',
  'Inline transcript HTML must contain safe readable content.':
    'El HTML integrado de la transcripción debe contener contenido seguro y legible.',
  'Learner UI text overrides must be an object.':
    'Las sustituciones de texto de la interfaz del estudiante deben ser un objeto.',
  'Learner UI text overrides must be non-empty strings.':
    'Las sustituciones de texto de la interfaz del estudiante deben ser cadenas no vacías.',
  'MIME type must start with "video/".': 'El tipo MIME debe comenzar con «video/».',
  'Manually review caption timing, accuracy, speaker identification, and meaningful sounds.':
    'Revise manualmente la sincronización y precisión de los subtítulos, la identificación de hablantes y los sonidos relevantes.',
  'Manually verify that the integrated audio describes every important visual detail.':
    'Verifique manualmente que el audio integrado describa cada detalle visual importante.',
  'Meaningful synchronized audio requires captions.':
    'El audio sincronizado significativo requiere subtítulos descriptivos.',
  'Media asset version must be 1.': 'La versión del recurso multimedia debe ser 1.',
  'Media is required.': 'Se requiere contenido multimedia.',
  'Media kind must be "video".': 'El tipo de contenido multimedia debe ser «video».',
  'Media must be an object.': 'El contenido multimedia debe ser un objeto.',
  'Model must be an object.': 'El modelo debe ser un objeto.',
  'Only one text track can be the default.': 'Solo una pista de texto puede ser la predeterminada.',
  'Plain transcript content must be text.':
    'El contenido sin formato de la transcripción debe ser texto.',
  'Provide inline HTML, plain text, or an external transcript URL.':
    'Proporcione HTML integrado, texto sin formato o una URL externa para la transcripción.',
  'Resolve how captions are provided before publishing.':
    'Defina cómo se proporcionan los subtítulos descriptivos antes de publicar.',
  'Review whether important visual information is described in the audio.':
    'Revise si la información visual importante se describe en el audio.',
  'Review whether the video contains meaningful synchronized audio.':
    'Revise si el video contiene audio sincronizado significativo.',
  'Source must be an object with a URL.': 'La fuente debe ser un objeto con una URL.',
  'Subtitles do not automatically include speakers and meaningful sounds; add captions when audio is meaningful.':
    'Los subtítulos de traducción no incluyen automáticamente hablantes ni sonidos relevantes; agregue subtítulos descriptivos cuando el audio sea significativo.',
  'Text tracks must be an array.': 'Las pistas de texto deben ser una matriz.',
  'The captions-track declaration requires a complete captions track.':
    'La declaración de pista de subtítulos requiere una pista de subtítulos descriptivos completa.',
  'The transcript is external-only; verify that the linked resource remains available and accessible.':
    'La transcripción es solo externa; verifique que el recurso enlazado siga disponible y sea accesible.',
  'Track URL is required.': 'Se requiere la URL de la pista.',
  'Track label is required.': 'Se requiere la etiqueta de la pista.',
  'Track must be an object.': 'La pista debe ser un objeto.',
  'Transcript must be an object.': 'La transcripción debe ser un objeto.',
  'Use a specific label that identifies the video content.':
    'Use una etiqueta específica que identifique el contenido del video.',
  'Verify this video encoding in all supported browsers.':
    'Verifique esta codificación de video en todos los navegadores compatibles.',
  'Video label is required.': 'Se requiere la etiqueta del video.',
  'Video sources must be an array.': 'Las fuentes de video deben ser una matriz.',
  'Width must be a positive whole number.': 'El ancho debe ser un número entero positivo.',
});

export type AuthorLocale = keyof typeof AUTHOR_MESSAGES;
export type AuthorMessageKey = keyof (typeof AUTHOR_MESSAGES)['en'];

export function resolveAuthorLocale(locale: string | undefined): AuthorLocale {
  return locale?.toLowerCase().startsWith('es') ? 'es' : 'en';
}

export function localizeAuthorFinding(message: string, locale: AuthorLocale): string {
  if (locale !== 'es') return message;
  if (message.startsWith('Unknown learner UI text key:')) {
    return message.replace('Unknown learner UI text key:', 'Clave de texto desconocida:');
  }
  return SPANISH_CONTROLLER_MESSAGES[message] ?? message;
}
