import { chatActionSend } from './chat-action.send';

export function makeChatService() {
  return { send: chatActionSend };
}

export type ChatService = ReturnType<typeof makeChatService>;
