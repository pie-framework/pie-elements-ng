import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  videoLabel: '동영상',
  transcriptLabel: '동영상 스크립트',
  retrying: '다시 시도하는 중…',
  retryingDescription: '브라우저가 동영상을 다시 불러오고 있습니다.',
  trackUnavailable: '텍스트 트랙을 사용할 수 없음',
  trackErrorDescription: '텍스트 트랙을 불러올 수 없습니다. 동영상을 다시 시도할 수 있습니다.',
  videoUnavailable: '동영상을 사용할 수 없음',
  missingVideoSource:
    '재생할 수 있는 동영상 소스가 없습니다. 스크립트가 제공된 경우 계속 볼 수 있습니다.',
  videoErrorDescription:
    '연결을 확인하고 다시 시도하십시오. 스크립트가 제공된 경우 계속 볼 수 있습니다.',
  retry: '다시 시도',
} satisfies MessageCatalog;
