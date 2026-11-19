import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  videoLabel: 'Video',
  transcriptLabel: 'Transcripción del video',
  retrying: 'Intentando de nuevo…',
  retryingDescription: 'El navegador está cargando el video de nuevo.',
  trackUnavailable: 'Pista de texto no disponible',
  trackErrorDescription:
    'No se pudo cargar una pista de texto. Puede volver a intentar cargar el video.',
  videoUnavailable: 'Video no disponible',
  missingVideoSource:
    'No hay una fuente de video reproducible. La transcripción sigue disponible cuando se proporciona.',
  videoErrorDescription:
    'Compruebe su conexión e inténtelo de nuevo. La transcripción sigue disponible cuando se proporciona.',
  retry: 'Intentar de nuevo',
} satisfies MessageCatalog;
