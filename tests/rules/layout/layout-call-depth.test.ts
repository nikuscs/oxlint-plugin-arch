import { describe, it } from 'vitest'
import { layoutCallDepth } from '../../../src/rules/layout/layout-call-depth.ts'
import { testerRun } from '../../utils/tester.utils.ts'

describe('arch/layout-call-depth', () => {
  it.each([
    { name: 'two levels pass', code: 'run(load(id))' },
    { name: 'a split outer call passes', code: 'run(\n  load(parse(id)),\n)', options: { max: 3 } },
    { name: 'callbacks reset the depth', code: 'run(() => load(parse(id)))' },
    { name: 'three levels fail', code: 'run(load(parse(id)))', errors: ['deep'] },
    { name: 'only the outermost call reports', code: 'save(run(load(parse(id))))', errors: ['deep'] },
    { name: 'max raises the limit', code: 'run(load(parse(id)))', options: { max: 3 } },
    { name: 'callbacks start a new count by default', code: 'const ids = Array.getSomes(Array.map(parts, (part) => decode(schema)(part)))' },
    {
      name: 'callbacks count through inline callbacks',
      code: 'const ids = Array.getSomes(Array.map(parts, (part) => decode(schema)(part)))',
      options: { callbacks: true },
      errors: ['Calls nest 3 deep on one line (max 2). Break the outer call or name an inner value.'],
    },
    { name: 'callbacks report only the outermost call', code: 'save(run((item) => load(read(item))))', options: { callbacks: true }, errors: ['deep'] },
    { name: 'callbacks pass a shallow callback', code: 'items.map((item) => load(item))', options: { callbacks: true } },
    { name: 'callbacks report a block callback once', code: 'x(() => { return y(z(q(1))) })', options: { callbacks: true }, errors: ['deep'] },
  ])('$name', (row) => testerRun(layoutCallDepth, row))
})
