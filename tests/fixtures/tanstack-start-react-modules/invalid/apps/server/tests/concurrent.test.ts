import { test } from 'vitest';

test.concurrent('queries', ({ db }) => {
  db.query();
});
