import { test as base } from 'vitest';

const test = base.extend({ amount: 1 });

test.for([1])('checks %s', (amount) => {
  Math.abs(amount);
});
