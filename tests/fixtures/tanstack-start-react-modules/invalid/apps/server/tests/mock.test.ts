import { expect, test, vi } from 'vitest';

vi.mock('../src/services/chat/chat.service');

test('mocks', () => {
  expect(true).toBe(true);
});
