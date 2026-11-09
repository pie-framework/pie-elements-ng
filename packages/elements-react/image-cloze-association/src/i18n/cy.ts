import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  answerChoice: 'Dewis ateb {index} o {total}',
  image: {
    zero: 'Delwedd gyda {count} o fannau ymateb',
    one: 'Delwedd gyda {count} man ymateb',
    two: 'Delwedd gyda {count} fan ymateb',
    few: 'Delwedd gyda {count} man ymateb',
    many: 'Delwedd gyda {count} man ymateb',
    other: 'Delwedd gyda {count} o fannau ymateb',
  },
  reachedLimit: {
    zero: 'Llawn',
    one: 'Rydych chi wedi cyrraedd y terfyn o {count} ymateb i bob ardal. I ychwanegu ymateb arall, rhaid tynnu un yn gyntaf.',
    two: 'Llawn',
    few: 'Llawn',
    many: 'Llawn',
    other: 'Llawn',
  },
  responseArea: 'Man ymateb {index} o {total}',
} satisfies MessageCatalog;
