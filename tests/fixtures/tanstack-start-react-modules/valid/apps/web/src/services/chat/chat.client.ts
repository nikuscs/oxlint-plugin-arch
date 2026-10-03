import type { ChatPreview } from '../../types/chat.types';

export function chatLabel(params: ChatPreview) {
  if (!params.text) {
    return 'Untitled';
  }

  return `${params.id}: ${params.text}`;
}
