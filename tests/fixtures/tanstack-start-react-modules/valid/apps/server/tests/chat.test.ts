import { expect, test } from 'vitest';
import { chatActionSend } from '../src/services/chat/chat-action.send';

test('trims chat messages', () => {
  const message = chatActionSend({ id: 'one', text: ' Hello ' });

  expect(message.text).toBe('Hello');
});
