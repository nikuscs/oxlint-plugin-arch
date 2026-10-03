import { os } from '@orpc/server'; import { chatMessageSchema } from '../../types/chat.types'; export const endpoint = os.output(chatMessageSchema).handler(() => ({id: 'one',text:'hello'}));
