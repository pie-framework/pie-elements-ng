import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  choicesListA11y: 'Lista med svarsalternativ',
  answerA11y: 'Svar {id}',
  responseAreaForA11y: 'Svarsområde för {prompt}',
  responseAreaA11y: 'Svarsområde {id}',
  dragInstructionsA11y: 'Tryck på blanksteg eller Enter för att plocka upp det här svarsalternativet. När det är upplockat använder du Tabb eller Skift+Tabb för att gå mellan svarsområdena, eller piltangenterna för att flytta det fritt. Tryck på blanksteg eller Enter för att släppa, eller Esc för att avbryta. Du kan också klicka på ett svarsalternativ för att markera det och sedan klicka på ett svarsområde för att placera det där.',
  pickedUpA11y: 'Plockade upp {choice}. Använd Tabb för att gå mellan svarsområdena och tryck sedan på blanksteg eller Enter för att släppa.',
  notOverResponseAreaA11y: '{choice} är inte över ett svarsområde.',
  overFilledA11y: 'Över {target}. Innehåller just nu {choice}.',
  overEmptyA11y: 'Över {target}. Tomt just nu.',
  returnedA11y: '{choice} har flyttats tillbaka till sin ursprungliga plats.',
  droppedA11y: 'Släppte {choice} i {target}.',
  cancelledA11y: 'Avbrutet. {choice} har flyttats tillbaka till sin ursprungliga plats.',
} satisfies MessageCatalog;
