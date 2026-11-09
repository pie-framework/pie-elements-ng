import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  videoLabel: 'Video',
  transcriptLabel: 'Transkription av videon',
  retrying: 'Försöker igen…',
  retryingDescription: 'Webbläsaren läser in videon igen.',
  trackUnavailable: 'Textspåret är inte tillgängligt',
  trackErrorDescription: 'Ett textspår kunde inte läsas in. Du kan försöka spela upp videon igen.',
  videoUnavailable: 'Videon är inte tillgänglig',
  missingVideoSource:
    'Det finns ingen spelbar videokälla. Transkriptionen är fortfarande tillgänglig om den finns.',
  videoErrorDescription:
    'Kontrollera anslutningen och försök igen. Transkriptionen är fortfarande tillgänglig om den finns.',
  retry: 'Försök igen',
} satisfies MessageCatalog;
