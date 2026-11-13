import { describe, it } from 'vitest'
import { codeInline } from '../../../src/rules/code/code-inline.ts'
import { testerRun } from '../../utils/tester.utils.ts'

describe('arch/code-inline', () => {
  it.each([
    { name: 'a value read twice passes', code: 'function run() {\n  const id = load()\n  save(id)\n  send(id)\n}' },
    { name: 'a data literal passes', code: 'function run() {\n  const user = { id }\n  save(user)\n}' },
    { name: 'a read inside a callback passes', code: 'function run() {\n  const id = load()\n  return () => save(id)\n}' },
    { name: 'a value read once fails', code: 'function run() {\n  const id = load()\n  save(id)\n}', errors: ['once'] },
    { name: 'a call between the value and its read passes', code: 'function run() {\n  const id = load()\n  mutate()\n  save(id)\n}' },
    { name: 'an assignment between the value and its read passes', code: 'function run() {\n  const id = state.id\n  state.id = 2\n  save(id)\n}' },
    { name: 'a callback defined between still fails', code: 'function run() {\n  const id = load()\n  const later = () => mutate()\n  save(id, later)\n}', errors: ['once', 'once'] },
    { name: 'inlining past max passes', code: 'function run() {\n  const id = loadEverything()\n  save(id)\n}', options: { max: 20 } },
    { name: 'inlining past nesting passes', code: 'function run() {\n  const id = load(parse(raw))\n  save(id)\n}', options: { nesting: 2 } },
    { name: 'a service method passes', code: 'function run() {\n  const send = make()\n  return Mail.of({ send })\n}', options: { services: ['of'] } },
    { name: 'a top-level value read once fails', code: 'const id = load()\nsave(id)', errors: ['once'] },
    { name: 'a top-level call between the value and its read passes', code: 'const id = load()\nmutate()\nsave(id)' },
    { name: 'an exported value passes', code: 'const id = load()\nexport { id }' },
    { name: 'a trivial top-level wrapper fails', code: 'const send = (id) => post(id)\nsend(1)\nsend(2)', errors: ['trivial'] },
    { name: 'keep skips the trivial check', code: 'const Send = (id) => post(id)\nSend(1)\nSend(2)', options: { keep: '^[A-Z]' } },
    { name: 'allow skips a name', code: 'const decodeUser = load()\nsave(decodeUser)', options: { allow: '^decode' } },
    {
      name: 'callbacks keep a value named for depth',
      code: 'const urlFilter = makeFilter((value) => URL.canParse(value))\nexport const Url = check(urlFilter)',
      options: { callbacks: true },
    },
    { name: 'callbacks off still inlines the filter', code: 'const urlFilter = makeFilter((value) => URL.canParse(value))\nexport const Url = check(urlFilter)', errors: ['once'] },
    { name: 'a top-level value that would nest too deep stays named', code: 'const parsed = parse(read(input))\nexport const value = save(parsed)' },
    {
      name: 'a wrapper that would make a use too long stays named',
      code: 'const count = Schema.Union([Schema.Int, Schema.FiniteFromString]).check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(0))\nconst numbers = { posts: Schema.optional(count), old: Schema.optional(count) }',
      options: { max: 120 },
    },
  ])('$name', (row) => testerRun(codeInline, row))
})
