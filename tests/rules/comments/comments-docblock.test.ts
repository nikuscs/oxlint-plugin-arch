import { describe, it } from 'vitest'
import { commentsDocblock } from '../../../src/rules/comments/comments-docblock.ts'
import { testerRun } from '../../utils/tester.utils.ts'

describe('arch/comments-docblock', () => {
  it.each([
    { name: 'a documented const passes', code: '/** Builds an order. */\nexport const orderFactory = make()' },
    { name: 'a documented function passes', code: '/**\n * Seeds a user.\n */\nexport function userScenario() {}' },
    { name: 'a documented default class passes', code: '/** The app layer. */\nexport default class AppLayer {}' },
    { name: 'blank lines between pass', code: '/** Cases. */\n\nexport const orderCases = []' },
    { name: 'unexported declarations pass', code: 'const local = 1\nfunction helper() {}' },
    { name: 're-exports pass', code: "export { a } from './a.ts'\nexport * from './b.ts'\nconst c = 1\nexport { c }" },
    { name: 'a default expression passes', code: 'export default {}' },
    { name: 'kinds outside the list pass', code: 'export type Order = { id: string }', options: { kinds: ['const', 'function'] } },
    { name: 'names outside the list pass', code: 'export const orderHelper = 1', options: { names: 'Factory$' } },
    { name: 'a missing const', code: 'export const orderFactory = make()', errors: ['missing'] },
    { name: 'a line comment does not count', code: '// Builds an order.\nexport const orderFactory = make()', errors: ['missing'] },
    { name: 'a plain block does not count', code: '/* Builds an order. */\nexport const orderFactory = make()', errors: ['missing'] },
    { name: 'code between does not count', code: '/** Builds an order. */\nconst x = 1\nexport const orderFactory = make()', errors: ['missing'] },
    { name: 'a docblock of the previous export does not count', code: '/** First. */\nexport const first = 1\nexport const second = 2', errors: ['missing'] },
    { name: 'a docblock below does not count', code: 'export const orderFactory = make()\n/** Later. */\nconst later = 1', errors: ['missing'] },
    { name: 'a missing default function', code: 'export default function scenario() {}', errors: ['missing'] },
    { name: 'a missing interface and enum', code: 'export interface Order {}\nexport enum Status { Open }', errors: ['missing', 'missing'] },
    { name: 'a matching name among several', code: 'export const a = 1, orderFactory = make()', options: { names: 'Factory$' }, errors: ["Write a /** … */ docblock above 'orderFactory'."] },
    { name: 'a listed kind', code: 'export function userScenario() {}', options: { kinds: ['function'] }, errors: ['missing'] },
    {
      name: 'custom message',
      code: 'export const orderCases = []',
      options: { message: 'Say what the cases cover.' },
      errors: ["Write a /** … */ docblock above 'orderCases'. Say what the cases cover."],
    },
  ])('$name', (row) => testerRun(commentsDocblock, row))
})
