import { test, expect, vi } from 'vitest'; test('injects a dependency', () => { const send = vi.fn(); const service = makeService({send}); service.send(); expect(send).toHaveBeenCalled(); });
