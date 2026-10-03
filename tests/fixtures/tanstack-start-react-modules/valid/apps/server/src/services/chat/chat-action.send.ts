import type { ChatMessage, ChatSendParams } from '../../types/chat.types';

export function chatActionSend(params: ChatSendParams): ChatMessage {
  return { id: params.id, text: params.text.trim() };
}
