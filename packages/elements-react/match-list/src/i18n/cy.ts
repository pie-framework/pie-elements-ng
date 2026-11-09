import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  choicesListA11y: 'Rhestr o ddewisiadau',
  answerA11y: 'Ateb {id}',
  responseAreaForA11y: 'Ardal ymateb ar gyfer {prompt}',
  responseAreaA11y: 'Ardal ymateb {id}',
  dragInstructionsA11y: "Pwyswch Bylchwr neu Enter i godi'r dewis ateb hwn. Ar ôl ei godi, defnyddiwch Tab neu Shift+Tab i symud drwy'r ardaloedd ymateb, neu defnyddiwch y bysellau saeth i'w symud yn rhydd. Pwyswch Bylchwr neu Enter i'w ollwng, neu Escape i ganslo. Gallwch hefyd glicio ar ddewis ateb i'w ddewis, yna clicio ar ardal ymateb i'w osod yno.",
  pickedUpA11y: "Wedi codi {choice}. Defnyddiwch Tab i symud rhwng yr ardaloedd ymateb, yna pwyswch Bylchwr neu Enter i'w ollwng.",
  notOverResponseAreaA11y: 'Nid yw {choice} dros ardal ymateb.',
  overFilledA11y: 'Dros {target}. Yn cynnwys {choice} ar hyn o bryd.',
  overEmptyA11y: 'Dros {target}. Yn wag ar hyn o bryd.',
  returnedA11y: "Mae {choice} wedi dychwelyd i'w safle gwreiddiol.",
  droppedA11y: 'Wedi gollwng {choice}. Lleoliad: {target}.',
  cancelledA11y: "Wedi canslo. Mae {choice} wedi dychwelyd i'w safle gwreiddiol.",
} satisfies MessageCatalog;
