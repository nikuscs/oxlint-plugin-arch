import { describe, it } from 'vitest'
import { effectMergePipe } from '../../../src/rules/effect/effect-merge-pipe.ts'
import { testerRun } from '../../utils/tester.utils.ts'

describe('arch/effect-merge-pipe', () => {
  it.each([
    { name: 'a one-line merge may pipe', code: 'const layer = Layer.mergeAll(A, B).pipe(Layer.provide(C))' },
    { name: 'a named merge pipes', code: 'const Merged = Layer.mergeAll(\n  A,\n  B,\n)\nconst layer = Merged.pipe(Layer.provide(C))' },
    {
      name: 'a merge as a later pipe argument passes',
      code: 'const layer = pipe(\n  A,\n  Layer.provideMerge(Layer.mergeAll(\n    B,\n    C,\n  )),\n)',
    },
    { name: 'a multi-line merge not piped passes', code: 'const layer = Layer.mergeAll(\n  A,\n  B,\n)' },
    { name: 'other callees pass', code: 'const layer = Layer.merge(\n  A,\n  B,\n).pipe(Layer.provide(C))' },
    { name: '.pipe( on the closing line', code: 'const layer = Layer.mergeAll(\n  A,\n  B,\n).pipe(Layer.provide(C))', errors: ['piped'] },
    { name: '.pipe( on the next line', code: 'const layer = Layer.mergeAll(\n  A,\n  B,\n)\n  .pipe(Layer.provide(C))', errors: ['piped'] },
    {
      name: 'first argument of pipe',
      code: 'const layer = pipe(\n  Layer.mergeAll(\n    A,\n    B,\n  ),\n  Layer.provide(C),\n)',
      errors: ['piped'],
    },
    {
      name: 'first argument of Function.pipe',
      code: 'const layer = Function.pipe(Layer.mergeAll(\n  A,\n  B,\n), Layer.provide(C))',
      errors: ['piped'],
    },
    {
      name: '.pipe( passes when methods leave it out',
      code: 'const layer = Layer.mergeAll(\n  A,\n  B,\n).pipe(Layer.provide(C))',
      options: { methods: ['compose'] },
    },
    {
      name: 'a custom pipe method',
      code: 'const layer = Layer.mergeAll(\n  A,\n  B,\n).compose(Layer.provide(C))',
      options: { methods: ['compose'] },
      errors: ['piped'],
    },
    {
      name: 'a custom merge callee',
      code: 'const layer = Layer.merge(\n  A,\n  B,\n).pipe(Layer.provide(C))',
      options: { merge: ['Layer.merge'] },
      errors: ['piped'],
    },
    {
      name: 'a custom pipe callee',
      code: 'const layer = flow(Layer.mergeAll(\n  A,\n  B,\n), Layer.provide(C))',
      options: { pipe: ['flow'] },
      errors: ['piped'],
    },
  ])('$name', (row) => testerRun(effectMergePipe, row))
})
