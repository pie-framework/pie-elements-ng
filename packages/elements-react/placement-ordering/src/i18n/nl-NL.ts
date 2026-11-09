import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  dragInstructions: 'Druk op Spatie of Enter om deze antwoordkeuze op te pakken. Gebruik daarna Tab of Shift+Tab om langs de antwoordvakken te gaan, of de pijltjestoetsen om de keuze vrij te verplaatsen. Druk op Spatie of Enter om los te laten, of op Escape om te annuleren.',
  commonCorrectAnswerWithAlternates: 'Opmerking: het antwoord hierboven is het meest voorkomende juiste antwoord voor deze opgave. Er zijn ook een of meer andere juiste antwoorden vastgelegd, en die worden ook als juist herkend.',
  readingInstructions: 'Maak een gesorteerde lijst door elk object naar de juiste positie te verplaatsen. Gebruik Tab om te wisselen tussen objecten en plaatsingsvakken, Enter om te selecteren of neer te zetten en Esc om te annuleren.',
  objectsAreOnSortedList: {
    one: '{sorted} van {total} object staat in de gesorteerde lijst.',
    other: '{sorted} van {total} objecten staan in de gesorteerde lijst.',
  },
  unsortedObjects: {
    one: '{count} ongesorteerd object',
    other: '{count} ongesorteerde objecten',
  },
  sortedObjects: {
    one: '{count} gesorteerd object',
    other: '{count} gesorteerde objecten',
  },
  unsortedObjectPrefix: 'object:',
  sortedObjectPrefix: 'Positie {position}:',
  endOfUnsorted: 'Einde van de ongesorteerde objecten',
  endOfSorted: 'Einde van de gesorteerde objecten.',
  useTabToObject: 'Gebruik Tab om naar een object te gaan.',
  unsortedObjectFocus: 'Ongesorteerd object {text} Druk op Enter om te selecteren of op Tab om naar een ander object te gaan.',
  sortedObjectFocus: 'Gesorteerd object {text} Op positie {position} van {total}. Druk op Enter om te selecteren of op Tab om naar een ander object te gaan',
  emptyPositionFocus: 'Op positie {position} van {total}, die leeg is. Druk op Enter om het geselecteerde object {text} hierheen te verplaatsen of gebruik Tab om naar een andere positie te gaan.',
  occupiedPositionFocus: 'Op positie {position} van {total}, die het object {occupant} bevat. Gebruik Tab om naar een andere positie te gaan of druk op Enter om het geselecteerde object {text} hierheen te verplaatsen, waardoor het object dat nu op positie {position} staat terug naar de ongesorteerde lijst gaat.',
  unsortedListReturnFocus: 'In de ongesorteerde lijst. Druk op Enter om het geselecteerde object {text} terug te zetten naar ongesorteerd of gebruik Tab om naar een positie te gaan.',
  unsortedListLeaveFocus: 'In de ongesorteerde lijst. Druk op Enter om object {text} ongesorteerd te laten of gebruik Tab om naar een positie te gaan.',
  selectedUnsorted: 'Geselecteerd object {text} Gebruik Tab om naar een positie in de gesorteerde lijst te gaan.',
  selectedSorted: 'Geselecteerd object {text}, dat op positie {position} van {total} staat. Gebruik Tab om naar een andere positie te gaan.',
  placed: 'Object {text} geplaatst op positie {position} van {total}.',
  moved: 'Object {text} verplaatst van positie {from} naar positie {to}.',
  removed: 'Object {text} verwijderd van positie {position}.',
  returnedToUnsorted: 'Object {text} is teruggezet in de ongesorteerde lijst.',
  answerComplete: {
    one: 'Het antwoord is compleet. {total} van {total} object in de gesorteerde lijst.',
    other: 'Het antwoord is compleet. {total} van {total} objecten in de gesorteerde lijst.',
  },
  objectsOnSortedList: {
    one: '{sorted} van {total} object in de gesorteerde lijst.',
    other: '{sorted} van {total} objecten in de gesorteerde lijst.',
  },
  useTabToAnotherObject: 'Gebruik Tab om naar een ander object te gaan.',
  noLongerSelected: 'Object {text} is niet meer geselecteerd.',
} satisfies MessageCatalog;
