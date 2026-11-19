import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  videoLabel: '视频',
  transcriptLabel: '视频文字稿',
  retrying: '正在重试…',
  retryingDescription: '浏览器正在重新加载视频。',
  trackUnavailable: '文本轨道不可用',
  trackErrorDescription: '无法加载文本轨道。可以重试视频。',
  videoUnavailable: '视频不可用',
  missingVideoSource: '没有可播放的视频源。如提供了文字稿，仍可查看。',
  videoErrorDescription: '请检查网络连接后重试。如提供了文字稿，仍可查看。',
  retry: '重试',
} satisfies MessageCatalog;
