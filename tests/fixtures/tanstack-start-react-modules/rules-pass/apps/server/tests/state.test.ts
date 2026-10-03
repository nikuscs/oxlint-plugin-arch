import { test, expect } from 'vitest'; test('owns state', () => { let value = 0; value += 1; expect(value).toBe(1); });
