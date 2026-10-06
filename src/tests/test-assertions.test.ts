import { test } from 'vitest'
import { testAssertions } from '../rules/module-policy/test-assertions.ts'
import { createRuleTester } from './rule-tester.ts'

test('fixture assertions cover local callbacks and called helpers without counting unused functions', () => {
  createRuleTester().run('modules/test-assertions', testAssertions, {
    valid: [
      "import { test as base, expect } from '@playwright/test'; const test = base.extend({ page: async ({ page }, use) => { await use(page); expect([]).toEqual([]); } });",
      "import { test as base, expect } from 'vitest'; const test = base.extend({ guard: [async ({}, use) => { await use(1); expect(1).toBe(1); }, { auto: true }] });",
      "const test = createKitTest(); test('polls', async () => { await expect.poll(() => 1).toBe(1); });",
      "const test = createKitTest(); test('soft', () => { expect.soft(1).toBe(1); });",
      "import { test as check, expect as verify } from 'vitest'; check('native', () => { verify(1).toBe(1); });",
      "const test = createKitTest(); test('value', () => { expect(1).toBe(1); });",
      "const test = createKitTest(); test.for([1])('value', (value) => { expect(value).toBe(1); });",
      "const test = createKitTest(); test.each`value\n${1}`('value', (value) => { expect(value).toBe(1); });",
      "const test = createKitTest(); test('value', check); function check() { expect(1).toBe(1); }",
      "const test = createKitTest(); test('value', () => { check(); }); function check() { expect(1).toBe(1); }",
      "const test = createKitTest(); test('value', async () => { await promise.then((value) => { expect(value).toBe(1); }); });",
      "import { assert as verify } from 'vitest'; const test = createKitTest(); test('value', () => { verify(true); });",
      {
        code: "import { integrationTest } from './test'; import { verifyResult } from './support'; integrationTest('value', () => { verifyResult(1); });",
        options: [
          { additionalTestFunctions: ['integrationTest'], additionalAssertionFunctions: ['verifyResult'] },
        ],
      },
      "const test = createKitTest(); test.todo('later');",
    ],
    invalid: [
      { code: "test('fake parameter', (expect) => { expect(1); });", errors: [{ messageId: 'missing' }] },
      {
        code: "import { test } from 'vitest'; test('empty native', () => {});",
        errors: [{ messageId: 'missing' }],
      },
      {
        code: "import { expect } from 'vitest'; const test = createKitTest(); test('imported matcher only', () => { expect.any(String); });",
        errors: [{ messageId: 'missing' }],
      },
      {
        code: "const test = createKitTest(); test('matcher only', () => { expect.any(String); });",
        errors: [{ messageId: 'missing' }],
      },
      { code: "const test = createKitTest(); test('empty', () => {});", errors: [{ messageId: 'missing' }] },
      {
        code: "const test = createKitTest(); test.for([1])('empty', (value) => { Math.abs(value); });",
        errors: [{ messageId: 'missing' }],
      },
      {
        code: "const test = createKitTest(); test('unused helper', () => { const check = () => expect(1).toBe(1); });",
        errors: [{ messageId: 'missing' }],
      },
      {
        code: "const test = createKitTest(); test('unused declaration', () => { function check() { expect(1).toBe(1); } });",
        errors: [{ messageId: 'missing' }],
      },
      {
        code: "const test = createKitTest(); test('fake expectation', () => { const expect = () => {}; expect(1); });",
        errors: [{ messageId: 'missing' }],
      },
      {
        code: "const test = createKitTest(); test('cyclic helpers', () => { first(); }); function first() { second(); } function second() { first(); }",
        errors: [{ messageId: 'missing' }],
      },
      {
        code: "const test = createKitTest(); function check() { expect(1).toBe(1); } test('shadow', () => { const check = () => {}; check(); });",
        errors: [{ messageId: 'missing' }],
      },
      {
        code: "import { integrationTest } from './test'; integrationTest.for([1])('empty', (value) => { Math.abs(value); });",
        options: [{ additionalTestFunctions: ['integrationTest'] }],
        errors: [{ messageId: 'missing' }],
      },
    ],
  })
})

test('table callbacks follow scope and every row; standalone assertions stay forbidden', () => {
  createRuleTester().run('modules/test-assertions', testAssertions, {
    valid: [
      "test.for([{ verify: (n) => expect(n).toBe(1) }])('row', ({ verify: check }) => check(1));",
      "const rows = [{ verify: (n) => expect(n).toBe(1) }] as const; test.for(rows)('row', (row) => row.verify(1));",
      "function verify(n) { expect(n).toBe(1); } test.each([{ verify }])('row', ({ verify }) => verify(1));",
      "const row = { verify: (n) => expect(n).toBe(1) }; const rows = [row]; test.for(rows)('row', ({ verify }) => verify(1));",
      {
        code: "test('architecture', () => arch().expect('src').not.toImport('private'));",
        options: [{ additionalAssertionFunctions: ['arch.**.to*'] }],
      },
      'const matcher = expect.any(String);',
      'function exportedAssertion() { expect(1).toBe(1); }',
    ],
    invalid: [
      {
        code: "test.for([{ verify: (n) => expect(n).toBe(1) }])('row', () => {});",
        errors: [{ messageId: 'missing' }],
      },
      {
        code: "test.for([{ verify: (n) => expect(n).toBe(1) }, { verify: () => {} }])('row', ({ verify }) => verify(1));",
        errors: [{ messageId: 'missing' }],
      },
      {
        code: "test.for([{ verify: (n) => expect(n).toBe(1) }, {}])('row', ({ verify }) => verify(1));",
        errors: [{ messageId: 'missing' }],
      },
      { code: "test.for([])('row', () => expect(1).toBe(1));", errors: [{ messageId: 'missing' }] },
      {
        code: "test.for([{ verify: (n) => expect(n).toBe(1) }])('row', ({ verify }) => { function run(verify) { verify(1); } run(() => {}); });",
        errors: [{ messageId: 'missing' }],
      },
      { code: 'expect(1).toBe(1);', errors: [{ messageId: 'standalone' }] },
      { code: "describe('suite', () => expect(1).toBe(1));", errors: [{ messageId: 'standalone' }] },
      { code: '(() => expect(1).toBe(1))();', errors: [{ messageId: 'standalone' }] },
      { code: 'const rows = [{ verify: () => expect(1).toBe(1) }];', errors: [{ messageId: 'standalone' }] },
    ],
  })
})
