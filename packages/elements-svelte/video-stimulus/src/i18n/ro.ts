import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  videoLabel: 'Videoclip',
  transcriptLabel: 'Transcrierea videoclipului',
  retrying: 'Se încearcă din nou…',
  retryingDescription: 'Browserul reîncarcă videoclipul.',
  trackUnavailable: 'Pistă de text indisponibilă',
  trackErrorDescription: 'O pistă de text nu a putut fi încărcată. Poți reîncerca videoclipul.',
  videoUnavailable: 'Videoclip indisponibil',
  missingVideoSource:
    'Nu este disponibilă nicio sursă video care poate fi redată. Transcrierea rămâne disponibilă atunci când este furnizată.',
  videoErrorDescription:
    'Verifică conexiunea și încearcă din nou. Transcrierea rămâne disponibilă atunci când este furnizată.',
  retry: 'Încearcă din nou',
} satisfies MessageCatalog;
