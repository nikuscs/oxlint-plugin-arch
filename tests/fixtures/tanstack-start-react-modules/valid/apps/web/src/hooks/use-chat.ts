import { useState } from 'react';

interface UseChatOptions {
  initial: string;
}

export function useChat({ initial }: UseChatOptions) {
  const [message, setMessage] = useState(initial);

  return { message, setMessage };
}
