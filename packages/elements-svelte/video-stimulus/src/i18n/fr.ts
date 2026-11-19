import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  videoLabel: 'Vidéo',
  transcriptLabel: 'Transcription de la vidéo',
  retrying: 'Nouvelle tentative…',
  retryingDescription: 'Le navigateur recharge la vidéo.',
  trackUnavailable: 'Piste de texte indisponible',
  trackErrorDescription:
    'Une piste de texte n’a pas pu être chargée. Il est possible de relancer la vidéo.',
  videoUnavailable: 'Vidéo indisponible',
  missingVideoSource:
    'Aucune source vidéo lisible n’est disponible. La transcription reste disponible lorsqu’elle est fournie.',
  videoErrorDescription:
    'Vérifier la connexion et réessayer. La transcription reste disponible lorsqu’elle est fournie.',
  retry: 'Réessayer',
} satisfies MessageCatalog;
