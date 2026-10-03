export function wrapperActionSend(params: ChatSendParams) { if (!params.text.trim()) { throw new ChatEmptyError(); } return client.send(params); }
