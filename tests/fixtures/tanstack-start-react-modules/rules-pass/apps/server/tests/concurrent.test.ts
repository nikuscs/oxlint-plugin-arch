import { test, expect } from 'vitest'; test.concurrent('owns a database', ({ database }) => { expect(database).toBeDefined(); });
