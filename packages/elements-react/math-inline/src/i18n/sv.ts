import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  mathResponseQuestion: 'Fråga med matematiskt svar',
  mathEquationResponseQuestion: 'Fråga med svar i form av en ekvation',
  keypadInstructions: 'Det här fältet stöder inmatning med både knappsats och tangentbord. Använd tangentbordet för att nå och använda den matematiska knappsatsen på skärmen, som accepterar LaTeX-kod. Använd nedåtpilen för att öppna knappsatsen och flytta mellan dess knappar. Använd Esc för att stänga knappsatsen och återgå till inmatningsfältet.',
  primaryCorrectWithAlternates: 'Obs! Svaret som visas ovan är det primära korrekta svaret som författaren har angett för den här uppgiften, men andra svar kan också godkännas som korrekta.',
  showNote: 'Visa anteckning',
  hideNote: 'Dölj anteckning',
  noteLabel: 'Obs!',
} satisfies MessageCatalog;
