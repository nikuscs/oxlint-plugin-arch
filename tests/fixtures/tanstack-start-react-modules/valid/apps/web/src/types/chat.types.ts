import type { ChatMessage } from '@fixture/server/client';

export type ChatPreview = Pick<ChatMessage, 'id' | 'text'>;
