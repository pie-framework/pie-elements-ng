import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  modelLabel: {
    zero: "Model {index} o {total}: {selected} o {count} o rannau wedi'u dewis",
    one: "Model {index} o {total}: {selected} o {count} rhan wedi'i dewis",
    two: "Model {index} o {total}: {selected} o {count} ran wedi'u dewis",
    few: "Model {index} o {total}: {selected} o {count} rhan wedi'u dewis",
    many: "Model {index} o {total}: {selected} o {count} rhan wedi'u dewis",
    other: "Model {index} o {total}: {selected} o {count} o rannau wedi'u dewis",
  },
  numberOfModels: 'Nifer y modelau',
  partsPerModel: 'Rhannau ym mhob model',
  warningTitle: 'Rhybudd',
  answerChangeWarning: "Bydd newid nifer y modelau neu'r rhannau ym mhob model yn dileu'r ateb a ychwanegwyd. Ydych chi'n siŵr eich bod am barhau?",
  confirm: 'Iawn',
  cancel: 'Canslo',
} satisfies MessageCatalog;
