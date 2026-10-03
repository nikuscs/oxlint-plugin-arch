import { z } from 'zod';

export const chatMessageSchema = z.object({ id: z.string(), text: z.string() });

export const chatSendSchema = chatMessageSchema;

export type ChatMessage = z.infer<typeof chatMessageSchema>;

export interface ChatSendParams {
  id: string;
  text: string;
}
