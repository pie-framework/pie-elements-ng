import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  videoLabel: 'Vídeo',
  transcriptLabel: 'Transcrição do vídeo',
  retrying: 'Tentando novamente…',
  retryingDescription: 'O navegador está carregando o vídeo novamente.',
  trackUnavailable: 'Faixa de texto indisponível',
  trackErrorDescription:
    'Não foi possível carregar uma faixa de texto. É possível tentar carregar o vídeo novamente.',
  videoUnavailable: 'Vídeo indisponível',
  missingVideoSource:
    'Nenhuma fonte de vídeo reproduzível está disponível. A transcrição continua disponível quando fornecida.',
  videoErrorDescription:
    'Verifique a conexão e tente novamente. A transcrição continua disponível quando fornecida.',
  retry: 'Tentar novamente',
} satisfies MessageCatalog;
