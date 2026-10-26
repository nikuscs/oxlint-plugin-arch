import { describe, it } from 'vitest'
import { testerRun } from '../../utils/tester.utils.ts'
import { testsModifiers } from './tests-modifiers.ts'

describe('arch/tests-modifiers', () => {
  it.each([
    { name: 'a plain test passes', code: "test('saves', () => {})" },
    { name: 'other modifiers pass', code: "test.concurrent('saves', fn); test.each([1])('saves %s', fn)" },
    { name: 'unrelated skip calls pass', code: 'reader.skip(1)' },
    { name: 'a renamed import passes', code: "import { test as check } from 'vitest'; check('saves', () => {})" },
    { name: 'imports from other packages are ignored', code: "import { test as check } from './check'; check.only('saves', fn)" },
    { name: 'custom function passes', code: "integrationTest('saves', fn)", options: { functions: ['integrationTest'] } },
    { name: 'test.only', code: "test.only('saves', () => {})", errors: ['modifier'] },
    { name: 'it.skip', code: "it.skip('saves', () => {})", errors: ['modifier'] },
    { name: 'describe.todo', code: "describe.todo('users')", errors: ['modifier'] },
    { name: 'suite.only', code: "suite.only('users', fn)", errors: ['modifier'] },
    { name: 'a modifier after another', code: "test.concurrent.only('saves', fn)", errors: ['modifier'] },
    { name: 'a modifier before each', code: "test.skip.each([1])('saves %s', fn)", errors: ['modifier'] },
    { name: 'a renamed vitest import', code: "import { test as check } from 'vitest'; check.only('saves', fn)", errors: ['modifier'] },
    { name: 'a renamed bun import', code: "import { it as spec } from 'bun:test'; spec.skip('saves', fn)", errors: ['modifier'] },
    { name: 'custom function', code: "integrationTest.only('saves', fn)", options: { functions: ['integrationTest'] }, errors: ['modifier'] },
    { name: 'dotted custom function', code: "e2e.integration.todo('later')", options: { functions: ['e2e.integration'] }, errors: ['modifier'] },
  ])('$name', (row) => testerRun(testsModifiers, row))
})
