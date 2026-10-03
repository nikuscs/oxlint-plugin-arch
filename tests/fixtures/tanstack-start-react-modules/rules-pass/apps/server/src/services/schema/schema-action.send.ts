import { chatMessageSchema } from '../../types/chat.types'; export function schemaActionSend(params: ChatSendParams) { return chatMessageSchema.parse(params); }
