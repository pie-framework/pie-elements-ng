import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  warningTitle: 'Waarschuwing',
  resetWarning: 'Hiermee worden alle elementen op de grafiek verwijderd en wordt de grafiek teruggezet naar de oorspronkelijke staat. Toch doorgaan?',
  defineLinesFirst: 'Eerst de lijn(en) definiëren en daarna een oplossingsverzameling voor het item selecteren.',
  lineChangeWarning: "Het wijzigen van een lijn na het toevoegen van een oplossingsverzameling wist de geselecteerde oplossingsverzameling. Met 'Oplossingsverzameling wissen' kan de lijn worden gewijzigd; met 'Annuleren' blijft alles ongewijzigd.",
  addLineAFirst: 'Eerst Lijn A aan de grafiek toevoegen en daarna Lijn B',
  addLineBFirst: 'Eerst Lijn B aan de grafiek toevoegen voordat naar Lijn A wordt overgeschakeld',
  clearSolutionSet: 'Oplossingsverzameling wissen',
  confirm: 'OK',
  cancel: 'Annuleren',
} satisfies MessageCatalog;
