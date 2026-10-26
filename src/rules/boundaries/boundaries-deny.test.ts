import { describe, it } from 'vitest'
import { testerRun } from '../../utils/tester.utils.ts'
import { boundariesDeny } from './boundaries-deny.ts'

describe('arch/boundaries-deny', () => {
  it.each([
    { name: 'no restrictions allows imports and calls', code: "import 'library'; console.log(value)" },
    { name: 'unlisted imports pass', code: "import 'allowed'", options: { imports: { denied: 'Use allowed.' } } },
    { name: 'single star does not cross segments', code: "import 'pkg/deep/module'", options: { imports: { 'pkg/*': '' } } },
    { name: 'dynamic targets are ignored', code: 'import(target)', options: { imports: { '**': '' } } },
    { name: 'unlisted calls pass', code: 'logger.info(value)', options: { calls: { 'console.log': '' } } },
    { name: 'static import', code: "import 'denied'", options: { imports: { denied: 'Use allowed.' } }, errors: ['import'] },
    { name: 'named re-export', code: "export { value } from 'denied'", options: { imports: { denied: '' } }, errors: ['import'] },
    { name: 'star re-export', code: "export * from 'denied'", options: { imports: { denied: '' } }, errors: ['import'] },
    { name: 'literal dynamic import', code: "import('denied')", options: { imports: { denied: '' } }, errors: ['import'] },
    { name: 'glob crosses segments', code: "import 'pkg/deep/module'", options: { imports: { 'pkg/**': '' } }, errors: ['import'] },
    { name: 'bare callee', code: 'save(value)', options: { calls: { save: 'Read only.' } }, errors: ['call'] },
    { name: 'member name', code: "db.insertInto('orders')", options: { calls: { insertInto: '' } }, errors: ['call'] },
    { name: 'dotted callee', code: 'console.log(value)', options: { calls: { 'console.log': '' } }, errors: ['call'] },
    { name: 'computed literal callee', code: "console['log'](value)", options: { calls: { 'console.log': '' } }, errors: ['call'] },
  ])('$name', (row) => testerRun(boundariesDeny, row))
})
