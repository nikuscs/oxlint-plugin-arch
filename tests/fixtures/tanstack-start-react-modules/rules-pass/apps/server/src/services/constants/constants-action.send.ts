import { CHAT_LIMIT } from '../../types/chat.constants'; export function constantsActionSend(params: ChatSendParams) { return params.text.slice(0, CHAT_LIMIT); }
