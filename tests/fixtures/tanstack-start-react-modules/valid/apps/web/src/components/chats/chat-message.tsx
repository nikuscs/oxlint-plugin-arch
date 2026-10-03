import type { ChatPreview } from '../../types/chat.types';

export interface ChatMessageProps {
  message: ChatPreview;
}

export function ChatMessage({ message }: ChatMessageProps) {
  return <p data-testid='message'>{message.text}</p>;
}
