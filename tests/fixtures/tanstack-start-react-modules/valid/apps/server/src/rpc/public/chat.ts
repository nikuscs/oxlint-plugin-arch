import { os } from '@orpc/server';
import { chatActionSend } from '../../services/chat/chat-action.send';
import { chatMessageSchema, chatSendSchema } from '../../types/chat.types';

export const chat = os
  .input(chatSendSchema)
  .output(chatMessageSchema)
  .handler(({ input }) => chatActionSend(input));
