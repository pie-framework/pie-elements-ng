import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  mathResponseQuestion: 'Question à réponse mathématique',
  mathEquationResponseQuestion: 'Question à réponse sous forme d’équation',
  keypadInstructions: "Ce champ accepte la saisie au pavé à l'écran et au clavier. Le clavier permet d'accéder au pavé mathématique à l'écran, qui accepte la syntaxe LaTeX, et de l'utiliser. La touche flèche vers le bas ouvre le pavé et permet de parcourir ses boutons. La touche Échap ferme le pavé et ramène au champ de saisie.",
  primaryCorrectWithAlternates: "Remarque : la réponse affichée ci-dessus est la réponse correcte principale indiquée par l'auteur pour cette question, mais d'autres réponses peuvent également être reconnues comme correctes.",
  showNote: 'Afficher la remarque',
  hideNote: 'Masquer la remarque',
  noteLabel: 'Remarque :',
} satisfies MessageCatalog;
