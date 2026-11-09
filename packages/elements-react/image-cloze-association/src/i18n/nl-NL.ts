import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  answerChoice: 'Antwoordkeuze {index} van {total}',
  image: {
    one: 'Afbeelding met {count} antwoordvak',
    other: 'Afbeelding met {count} antwoordvakken',
  },
  reachedLimit: {
    one: 'Je hebt het maximum van {count} antwoord per vak bereikt. Haal eerst een antwoord weg om een ander antwoord toe te voegen.',
    other: 'Vol',
  },
  responseArea: 'Antwoordvak {index} van {total}',
} satisfies MessageCatalog;
