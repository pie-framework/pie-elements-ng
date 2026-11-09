import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  warningTitle: 'Varning',
  resetWarning: 'Alla element som lagts till i grafen tas bort och grafen återställs till sitt ursprungliga läge. Vill du fortsätta?',
  defineLinesFirst: 'Definiera linjen eller linjerna och välj sedan en lösningsmängd för uppgiften.',
  lineChangeWarning: 'Om du ändrar en linje efter att ha lagt till en lösningsmängd rensas den valda lösningsmängden. Klicka på ”Rensa lösningsmängd” för att ändra linjen. Annars klickar du på ”Avbryt”.',
  addLineAFirst: 'Lägg till Linje A i grafen innan du lägger till Linje B',
  addLineBFirst: 'Lägg till Linje B i grafen innan du byter till Linje A',
  clearSolutionSet: 'Rensa lösningsmängd',
  confirm: 'OK',
  cancel: 'Avbryt',
} satisfies MessageCatalog;
