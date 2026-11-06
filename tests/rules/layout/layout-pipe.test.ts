import { describe, it } from 'vitest'
import { layoutPipe } from '../../../src/rules/layout/layout-pipe.ts'
import { testerRun } from '../../utils/tester.utils.ts'

describe('arch/layout-pipe', () => {
  it.each([
    { name: 'a pipe on a one-line call passes', code: 'load(id).pipe(map(f))' },
    { name: 'a pipe on its own line passes', code: 'load({\n  id,\n})\n  .pipe(map(f))' },
    { name: 'a step hugging a callback passes', code: 'value.pipe(map((item) => {\n  go(item)\n}))' },
    { name: 'a pipe after a multi-line call fails', code: 'load({\n  id,\n}).pipe(map(f))', errors: ['after'] },
    { name: 'a step with a multi-line call fails', code: 'value.pipe(retry(schedule({\n  times,\n})))', errors: ['step'] },
  ])('$name', (row) => testerRun(layoutPipe, row))
})
