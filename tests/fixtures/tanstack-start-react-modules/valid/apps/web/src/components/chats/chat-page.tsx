import { ChatMessage } from './chat-message';

const message = { id: 'one', text: 'Hello' };

export function ChatPage() {
  return <ChatMessage message={message} />;
}
