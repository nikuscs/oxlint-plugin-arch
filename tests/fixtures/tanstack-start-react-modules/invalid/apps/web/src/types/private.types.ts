import type { ChatMessage } from '../../../server/src/types/chat.types';

export type PrivatePreview = Pick<ChatMessage, 'id'>;
