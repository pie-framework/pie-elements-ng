import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  videoLabel: 'Fideo',
  transcriptLabel: "Trawsgrifiad o'r fideo",
  retrying: 'Yn rhoi cynnig arall arni…',
  retryingDescription: "Mae'r porwr yn llwytho'r fideo eto.",
  trackUnavailable: 'Trac testun ddim ar gael',
  trackErrorDescription: 'Doedd dim modd llwytho trac testun. Gallwch roi cynnig arall ar y fideo.',
  videoUnavailable: 'Fideo ddim ar gael',
  missingVideoSource:
    "Does dim ffynhonnell fideo y gellir ei chwarae ar gael. Mae'r trawsgrifiad yn dal ar gael pan fydd wedi'i ddarparu.",
  videoErrorDescription:
    "Gwiriwch eich cysylltiad a rhowch gynnig arall arni. Mae'r trawsgrifiad yn dal ar gael pan fydd wedi'i ddarparu.",
  retry: 'Rhoi cynnig arall arni',
} satisfies MessageCatalog;
