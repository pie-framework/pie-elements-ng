import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  choicesListA11y: 'Lista de opções',
  answerA11y: 'Resposta {id}',
  responseAreaForA11y: 'Área de resposta para {prompt}',
  responseAreaA11y: 'Área de resposta {id}',
  dragInstructionsA11y: 'Pressione Espaço ou Enter para pegar esta opção de resposta. Depois de pegá-la, use Tab ou Shift+Tab para percorrer as áreas de resposta, ou use as teclas de seta para movê-la livremente. Pressione Espaço ou Enter para soltá-la, ou Esc para cancelar. Você também pode clicar em uma opção de resposta para selecioná-la e depois clicar em uma área de resposta para colocá-la ali.',
  pickedUpA11y: 'Você pegou {choice}. Use Tab para se mover entre as áreas de resposta e depois pressione Espaço ou Enter para soltar.',
  notOverResponseAreaA11y: '{choice} não está sobre uma área de resposta.',
  overFilledA11y: 'Sobre {target}. Contém {choice} no momento.',
  overEmptyA11y: 'Sobre {target}. Sem conteúdo no momento.',
  returnedA11y: '{choice} voltou à posição original.',
  droppedA11y: 'Você soltou {choice} em {target}.',
  cancelledA11y: 'Cancelado. {choice} voltou à posição original.',
} satisfies MessageCatalog;
