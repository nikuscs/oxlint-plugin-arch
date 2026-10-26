import { describe, it } from 'vitest'
import { testerRun } from '../../utils/tester.utils.ts'
import { testsAssertions } from './tests-assertions.ts'

describe('arch/tests-assertions', () => {
  it.each([
    { name: 'expect in a test passes', code: "test('saves', () => { expect(1).toBe(1) })" },
    { name: 'it registers a test', code: "it('saves', () => { expect(1).toBe(1) })" },
    { name: 'expect.poll counts', code: "test('polls', async () => { await expect.poll(() => 1).toBe(1) })" },
    { name: 'expect.soft counts', code: "test('saves', () => { expect.soft(1).toBe(1) })" },
    { name: 'assert members count', code: "test('saves', () => { assert.equal(1, 1) })" },
    { name: 'renamed vitest imports', code: "import { test as check, expect as verify } from 'vitest'; check('saves', () => { verify(1).toBe(1) })" },
    { name: 'a renamed assert import', code: "import { assert as verify } from 'vitest'; test('saves', () => { verify(true) })" },
    { name: 'the expect fixture counts', code: "test('saves', ({ expect }) => { expect(1).toBe(1) })" },
    { name: 'test.for callback', code: "test.for([1])('saves %s', (value) => { expect(value).toBe(1) })" },
    { name: 'tagged test.each callback', code: "test.each`value`('saves $value', ({ value }) => { expect(value).toBe(1) })" },
    { name: 'a named callback', code: "test('saves', check); function check() { expect(1).toBe(1) }" },
    { name: 'a called helper', code: "test('saves', () => { check() }); function check() { expect(1).toBe(1) }" },
    { name: 'an inline promise callback', code: "test('saves', async () => { await load().then((value) => { expect(value).toBe(1) }) })" },
    { name: 'todo has no callback', code: "test.todo('later')" },
    { name: 'a test.extend fixture may assert', code: 'test.extend({ page: async ({ page }, use) => { await use(page); expect(page).toBeTruthy() } })' },
    {
      name: 'a tuple fixture on a renamed import may assert',
      code: "import { test as base } from 'vitest'; base.extend({ guard: [async ({}, use) => { await use(1); expect(1).toBe(1) }, { auto: true }] })",
    },
    { name: 'a renamed row callback', code: "test.for([{ verify: (n) => expect(n).toBe(1) }])('row', ({ verify: check }) => check(1))" },
    { name: 'a row member call', code: "const rows = [{ verify: (n) => expect(n).toBe(1) }] as const; test.for(rows)('row', (row) => row.verify(1))" },
    { name: 'a shorthand row function', code: "function verify(n) { expect(n).toBe(1) } test.each([{ verify }])('row', ({ verify }) => verify(1))" },
    {
      name: 'a row held in a const',
      code: "const row = { verify: (n) => expect(n).toBe(1) }; const rows = [row]; test.for(rows)('row', ({ verify }) => verify(1))",
    },
    { name: 'a matcher outside a test passes', code: 'const matcher = expect.any(String)' },
    { name: 'a declared helper may assert', code: 'function assertOne() { expect(1).toBe(1) }' },
    {
      name: 'custom functions and assertions',
      code: "import { integrationTest } from './test'; import { verifyResult } from './support'; integrationTest('saves', () => { verifyResult(1) })",
      options: { functions: ['integrationTest'], assertions: ['verifyResult'] },
    },
    { name: 'wildcard assertions', code: "test('architecture', () => arch().expect('src').not.toImport('private'))", options: { assertions: ['arch.**.to*'] } },
    {
      name: 'an assertion in a Playwright fixture passes',
      code: "import { test as base, expect } from '@playwright/test'; const test = base.extend({ page: async ({ page }, use) => { await use(page); expect([]).toEqual([]); } });",
    },
    {
      name: 'an assertion in a Vitest tuple fixture passes',
      code: "import { test as base, expect } from 'vitest'; const test = base.extend({ guard: [async ({}, use) => { await use(1); expect(1).toBe(1); }, { auto: true }] });",
    },
    {
      name: 'a polling assertion in a factory test passes',
      code: "const test = createKitTest(); test('polls', async () => { await expect.poll(() => 1).toBe(1); });",
    },
    { name: 'a soft assertion in a factory test passes', code: "const test = createKitTest(); test('soft', () => { expect.soft(1).toBe(1); });" },
    {
      name: 'a renamed native test and assertion passes',
      code: "import { test as check, expect as verify } from 'vitest'; check('native', () => { verify(1).toBe(1); });",
    },
    { name: 'an assertion in a factory test passes', code: "const test = createKitTest(); test('value', () => { expect(1).toBe(1); });" },
    {
      name: 'an assertion in a factory for callback passes',
      code: "const test = createKitTest(); test.for([1])('value', (value) => { expect(value).toBe(1); });",
    },
    {
      name: 'an assertion in a multiline tagged table passes',
      code: `const test = createKitTest(); test.each\`value
\${1}\`('value', (value) => { expect(value).toBe(1); });`,
    },
    {
      name: 'a named asserting callback in a factory test passes',
      code: "const test = createKitTest(); test('value', check); function check() { expect(1).toBe(1); }",
    },
    {
      name: 'a called asserting helper in a factory test passes',
      code: "const test = createKitTest(); test('value', () => { check(); }); function check() { expect(1).toBe(1); }",
    },
    {
      name: 'an assertion in a factory promise callback passes',
      code: "const test = createKitTest(); test('value', async () => { await promise.then((value) => { expect(value).toBe(1); }); });",
    },
    {
      name: 'a renamed assert in a factory test passes',
      code: "import { assert as verify } from 'vitest'; const test = createKitTest(); test('value', () => { verify(true); });",
    },
    {
      name: 'an imported custom test and assertion passes',
      code: "import { integrationTest } from './test'; import { verifyResult } from './support'; integrationTest('value', () => { verifyResult(1); });",
      options: { functions: ['integrationTest'], assertions: ['verifyResult'] },
    },
    { name: 'a factory todo without a callback passes', code: "const test = createKitTest(); test.todo('later');" },
    { name: 'an uncalled assertion function declaration passes', code: 'function exportedAssertion() { expect(1).toBe(1); }' },
    { name: 'an empty test', code: "test('saves', () => {})", errors: ['missing'] },
    { name: 'a matcher alone', code: "test('saves', () => { expect.any(String) })", errors: ['missing'] },
    { name: 'a parameter named expect', code: "test('saves', (expect) => { expect(1) })", errors: ['missing'] },
    { name: 'a local expect', code: "test('saves', () => { const expect = () => {}; expect(1) })", errors: ['missing'] },
    { name: 'an unused arrow helper', code: "test('saves', () => { const check = () => expect(1).toBe(1) })", errors: ['missing'] },
    { name: 'an unused declared helper', code: "test('saves', () => { function check() { expect(1).toBe(1) } })", errors: ['missing'] },
    { name: 'cyclic helpers', code: "test('saves', () => { first() }); function first() { second() } function second() { first() }", errors: ['missing'] },
    {
      name: 'a local helper shadows an asserting one',
      code: "function check() { expect(1).toBe(1) } test('saves', () => { const check = () => {}; check() })",
      errors: ['missing'],
    },
    { name: 'test.for without an assertion', code: "test.for([1])('saves %s', (value) => { Math.abs(value) })", errors: ['missing'] },
    {
      name: 'a custom function without an assertion',
      code: "integrationTest.for([1])('saves %s', (value) => { Math.abs(value) })",
      options: { functions: ['integrationTest'] },
      errors: ['missing'],
    },
    { name: 'an unused row callback', code: "test.for([{ verify: (n) => expect(n).toBe(1) }])('row', () => {})", errors: ['missing'] },
    {
      name: 'a row callback without an assertion',
      code: "test.for([{ verify: (n) => expect(n).toBe(1) }, { verify: () => {} }])('row', ({ verify }) => verify(1))",
      errors: ['missing'],
    },
    { name: 'a row without the callback', code: "test.for([{ verify: (n) => expect(n).toBe(1) }, {}])('row', ({ verify }) => verify(1))", errors: ['missing'] },
    { name: 'an empty table', code: "test.for([])('row', () => expect(1).toBe(1))", errors: ['missing'] },
    {
      name: 'a shadowed row callback',
      code: "test.for([{ verify: (n) => expect(n).toBe(1) }])('row', ({ verify }) => { function run(verify) { verify(1) } run(() => {}) })",
      errors: ['missing'],
    },
    { name: 'expect at the top level', code: 'expect(1).toBe(1)', errors: ['standalone'] },
    { name: 'expect in describe', code: "describe('users', () => expect(1).toBe(1))", errors: ['standalone'] },
    { name: 'expect in an IIFE', code: '(() => expect(1).toBe(1))()', errors: ['standalone'] },
    { name: 'expect in an unregistered table', code: 'const rows = [{ verify: () => expect(1).toBe(1) }]', errors: ['standalone'] },
    { name: 'a fake expect callback parameter', code: "test('fake parameter', (expect) => { expect(1); });", errors: ['missing'] },
    { name: 'an empty imported native test', code: "import { test } from 'vitest'; test('empty native', () => {});", errors: ['missing'] },
    {
      name: 'a factory test with only an imported matcher',
      code: "import { expect } from 'vitest'; const test = createKitTest(); test('imported matcher only', () => { expect.any(String); });",
      errors: ['missing'],
    },
    {
      name: 'a factory test with only a global matcher',
      code: "const test = createKitTest(); test('matcher only', () => { expect.any(String); });",
      errors: ['missing'],
    },
    { name: 'an empty factory test', code: "const test = createKitTest(); test('empty', () => {});", errors: ['missing'] },
    {
      name: 'a factory for callback without an assertion',
      code: "const test = createKitTest(); test.for([1])('empty', (value) => { Math.abs(value); });",
      errors: ['missing'],
    },
    {
      name: 'an unused arrow assertion in a factory test',
      code: "const test = createKitTest(); test('unused helper', () => { const check = () => expect(1).toBe(1); });",
      errors: ['missing'],
    },
    {
      name: 'an unused declared assertion in a factory test',
      code: "const test = createKitTest(); test('unused declaration', () => { function check() { expect(1).toBe(1); } });",
      errors: ['missing'],
    },
    {
      name: 'a locally shadowed expect in a factory test',
      code: "const test = createKitTest(); test('fake expectation', () => { const expect = () => {}; expect(1); });",
      errors: ['missing'],
    },
    {
      name: 'cyclic helpers in a factory test',
      code: "const test = createKitTest(); test('cyclic helpers', () => { first(); }); function first() { second(); } function second() { first(); }",
      errors: ['missing'],
    },
    {
      name: 'a shadowed asserting helper in a factory test',
      code: "const test = createKitTest(); function check() { expect(1).toBe(1); } test('shadow', () => { const check = () => {}; check(); });",
      errors: ['missing'],
    },
    {
      name: 'an imported custom for callback without an assertion',
      code: "import { integrationTest } from './test'; integrationTest.for([1])('empty', (value) => { Math.abs(value); });",
      options: { functions: ['integrationTest'] },
      errors: ['missing'],
    },
    { name: 'a standalone suite assertion statement', code: "describe('suite', () => expect(1).toBe(1));", errors: ['standalone'] },
  ])('$name', (row) => testerRun(testsAssertions, row))
})
