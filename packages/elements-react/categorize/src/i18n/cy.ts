import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  warning: 'Rhybudd',
  limitMaxChoicesPerCategory: 'Rydych chi wedi cyrraedd uchafswm yr ymatebion i bob ardal ({maxChoicesPerCategory}). I ychwanegu ymateb arall, rhaid tynnu un yn gyntaf.',
  cancel: 'Canslo',
  commonCorrectAnswerWithAlternates: "Nodyn: Yr ateb a ddangosir uchod yw'r ateb cywir mwyaf cyffredin ar gyfer yr eitem hon. Mae un neu ragor o atebion cywir ychwanegol wedi'u diffinio hefyd, a bydd y rheini hefyd yn cael eu cydnabod yn gywir.",
  maxChoicesPerCategoryRestriction: 'I newid y gwerth hwn i {maxChoicesPerCategory}, ni ddylai nifer y dewisiadau ateb ym mhob categori fod yn fwy na {maxChoicesPerCategory}.',
} satisfies MessageCatalog;
