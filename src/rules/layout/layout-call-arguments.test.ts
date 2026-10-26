import { describe, it } from 'vitest'
import { testerRun } from '../../utils/tester.utils.ts'
import { layoutCallArguments } from './layout-call-arguments.ts'

describe('arch/layout-call-arguments', () => {
  it.each([
    { name: 'two arguments stay inline', code: 'save(a, b)' },
    { name: 'already split call passes', code: 'save(\n  a,\n  b,\n  c,\n)' },
    { name: 'already split commented call passes', code: 'save(\n  a,\n  /* keep */ b,\n  c\n)' },
    { name: 'already split parenthesized call passes', code: 'save(\n  (a),\n  b,\n  c\n)' },
    { name: 'a multiline callback skips the call', code: "describe('x', options, () => {\n  run()\n})" },
    { name: 'min raises the threshold', code: 'save(a, b, c)', options: { min: 4 } },
    { name: 'a split new with a spread and trailing comma passes', code: 'new Box(\n  a,\n  b,\n  ...rest,\n)' },
    { name: 'a multiline function callback skips the call', code: "describe('x', options, function () {\n  run()\n})" },
    { name: 'splits a call', code: 'save(a, b, c)', output: 'save(\n  a,\n  b,\n  c\n)', errors: ['multiline'] },
    { name: 'splits a new expression with a spread', code: 'new Box(a, b, ...rest)', output: 'new Box(\n  a,\n  b,\n  ...rest\n)', errors: ['multiline'] },
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
    { name: 'a comment prevents a fix but not a report', code: 'save(a, /* keep */ b, c)', output: null, errors: ['multiline'] },
    { name: 'a parenthesized first argument reports without a fix', code: 'save((a), b, c)', output: null, errors: ['multiline'] },
    { name: 'a parenthesized middle argument reports without a fix', code: 'save(a, (b), c)', output: null, errors: ['multiline'] },
    { name: 'a parenthesized last argument reports without a fix', code: 'save(a, b, (c))', output: null, errors: ['multiline'] },
  ])('$name', (row) => testerRun(layoutCallArguments, row))
})
