import { describe, it } from 'vitest'
import { testerRun } from '../../utils/tester.utils.ts'
import { layoutCallArguments } from './layout-call-arguments.ts'

describe('arch/layout-call-arguments', () => {
  it.each([
    { name: 'two arguments stay inline', code: 'save(a, b)' },
    { name: 'already split call passes', code: 'save(\n  a,\n  b,\n  c,\n)' },
    { name: 'a comment inside skips the call', code: 'save(a, /* keep */ b, c)' },
    { name: 'a parenthesized argument skips the call', code: 'save((a), b, c)' },
    { name: 'a multiline callback skips the call', code: "describe('x', options, () => {\n  run()\n})" },
    { name: 'min raises the threshold', code: 'save(a, b, c)', options: { min: 4 } },
    { name: 'a split call with a spread and trailing comma passes', code: 'save(\n  a,\n  b,\n  ...rest,\n)' },
    { name: 'a split new with a spread and trailing comma passes', code: 'new Box(\n  a,\n  b,\n  ...rest,\n)' },
    { name: 'a parenthesized middle argument skips the call', code: 'save(a, (b), c)' },
    { name: 'a parenthesized last argument skips the call', code: 'save(a, b, (c))' },
    { name: 'a multiline function callback skips the call', code: "describe('x', options, function () {\n  run()\n})" },
    { name: 'a multiline callback skips the call at min 2', code: "describe('x', () => {\n  run()\n})", options: { min: 2 } },
    { name: 'a split call with a spread passes', code: 'save(\n  a,\n  b,\n  ...rest\n)' },
    { name: 'a split new with a spread passes', code: 'new Box(\n  a,\n  b,\n  ...rest\n)' },
    { name: 'splits a call', code: 'save(a, b, c)', output: 'save(\n  a,\n  b,\n  c\n)', errors: ['multiline'] },
    { name: 'keeps a trailing comma', code: 'save(a, b, c,)', output: 'save(\n  a,\n  b,\n  c,\n)', errors: ['multiline'] },
    { name: 'splits a new expression', code: 'new Box(a, b, c)', output: 'new Box(\n  a,\n  b,\n  c\n)', errors: ['multiline'] },
    { name: 'splits after type arguments', code: 'save<T>(a, b, c)', output: 'save<T>(\n  a,\n  b,\n  c\n)', errors: ['multiline'] },
    { name: 'splits an optional call', code: 'save?.(a, b, c)', output: 'save?.(\n  a,\n  b,\n  c\n)', errors: ['multiline'] },
    { name: 'reflows a partly split call', code: 'save(a,\n  b,\n  c)', output: 'save(\n  a,\n  b,\n  c\n)', errors: ['multiline'] },
    { name: 'a one-line callback still splits', code: 'save(a, b, () => c)', output: 'save(\n  a,\n  b,\n  () => c\n)', errors: ['multiline'] },
    {
      name: 'a multiline object argument still splits',
      code: 'save(a, b, {\n  value: c\n})',
      output: 'save(\n  a,\n  b,\n  {\n  value: c\n}\n)',
      errors: ['multiline'],
    },
    { name: 'min and indent options', code: '  save(a, b)', options: { min: 2, indent: 4 }, output: '  save(\n      a,\n      b\n  )', errors: ['multiline'] },
    { name: 'keeps CRLF line endings', code: 'save(a, b, c)\r\n', output: 'save(\r\n  a,\r\n  b,\r\n  c\r\n)\r\n', errors: ['multiline'] },
    { name: 'splits a new expression with a spread', code: 'new Box(a, b, ...rest)', output: 'new Box(\n  a,\n  b,\n  ...rest\n)', errors: ['multiline'] },
  ])('$name', (row) => testerRun(layoutCallArguments, row))
})
