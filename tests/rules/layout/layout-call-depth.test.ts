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
  ])('$name', (row) => testerRun(layoutCallDepth, row))
})
