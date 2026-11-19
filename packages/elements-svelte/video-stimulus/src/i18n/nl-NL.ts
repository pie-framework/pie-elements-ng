import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  videoLabel: 'Video',
  transcriptLabel: 'Transcriptie van de video',
  retrying: 'Opnieuw proberen…',
  retryingDescription: 'De browser laadt de video opnieuw.',
  trackUnavailable: 'Tekstspoor niet beschikbaar',
  trackErrorDescription: 'Een tekstspoor kon niet worden geladen. Probeer de video opnieuw.',
  videoUnavailable: 'Video niet beschikbaar',
  missingVideoSource:
    'Er is geen afspeelbare videobron beschikbaar. De transcriptie blijft beschikbaar als die is meegeleverd.',
  videoErrorDescription:
    'Controleer de verbinding en probeer het opnieuw. De transcriptie blijft beschikbaar als die is meegeleverd.',
  retry: 'Opnieuw proberen',
} satisfies MessageCatalog;
