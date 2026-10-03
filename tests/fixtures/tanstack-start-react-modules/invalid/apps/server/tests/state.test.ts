import { expect, test } from 'vitest';

let current = 0;

test('changes', () => {
  current += 1;

  expect(current).toBe(1);
});
