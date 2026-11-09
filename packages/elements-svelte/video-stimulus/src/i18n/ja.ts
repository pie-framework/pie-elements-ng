import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  videoLabel: '動画',
  transcriptLabel: '動画のトランスクリプト',
  retrying: '再試行しています…',
  retryingDescription: 'ブラウザーが動画を再読み込みしています。',
  trackUnavailable: 'テキストトラックを利用できません',
  trackErrorDescription: 'テキストトラックを読み込めませんでした。動画を再試行できます。',
  videoUnavailable: '動画を利用できません',
  missingVideoSource:
    '再生できる動画ソースがありません。トランスクリプトが用意されている場合は引き続き利用できます。',
  videoErrorDescription:
    '接続を確認して、もう一度お試しください。トランスクリプトが用意されている場合は引き続き利用できます。',
  retry: '再試行',
} satisfies MessageCatalog;
