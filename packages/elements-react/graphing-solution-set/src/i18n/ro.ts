import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  warningTitle: 'Avertisment',
  resetWarning: 'Această acțiune va elimina toate elementele adăugate pe grafic și va readuce graficul la starea inițială. Sigur vrei să continui?',
  defineLinesFirst: 'Definește mai întâi dreapta sau dreptele, apoi selectează mulțimea soluțiilor pentru item.',
  lineChangeWarning: 'Dacă modifici o dreaptă după ce ai adăugat mulțimea soluțiilor, mulțimea soluțiilor selectată va fi ștearsă. Fă clic pe „Șterge mulțimea soluțiilor” pentru a modifica dreapta. Altfel, fă clic pe „Anulează”.',
  addLineAFirst: 'Adaugă Dreapta A pe grafic înainte de a adăuga Dreapta B',
  addLineBFirst: 'Adaugă Dreapta B pe grafic înainte de a trece la Dreapta A',
  clearSolutionSet: 'Șterge mulțimea soluțiilor',
  confirm: 'OK',
  cancel: 'Anulează',
} satisfies MessageCatalog;
