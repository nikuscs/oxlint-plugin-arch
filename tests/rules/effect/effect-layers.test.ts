import { describe, it } from 'vitest'
import { effectLayers } from '../../../src/rules/effect/effect-layers.ts'
import { testerRun } from '../../utils/tester.utils.ts'

describe('arch/effect-layers', () => {
  it.each([
    { name: 'one layer passes', code: 'const layer = Layer.mergeAll(A)' },
    { name: 'a split merge passes', code: 'const layer = Layer.mergeAll(\n  A,\n  B,\n)' },
    { name: 'a split provide array passes', code: 'const layer = A.pipe(Layer.provide([\n  B,\n  C,\n]))' },
    { name: 'an array of one layer passes', code: 'const layer = A.pipe(Layer.provide([B]))' },
    { name: 'a provide without an array passes', code: 'const layer = A.pipe(Layer.provide(B), Layer.provide(C))' },
    { name: 'other callees pass', code: 'const all = Promise.all([a, b])' },
    { name: 'two layers stay under merge min 3', code: 'const layer = Layer.mergeAll(A, B)', options: { merge: { min: 3 } } },
    { name: 'two layers stay under provide min 3', code: 'const layer = A.pipe(Layer.provide([B, C]))', options: { provide: { min: 3 } } },
    {
      name: 'a callee left out of merge callees passes',
      code: 'const layer = Layer.mergeAll(A, B)',
      options: { merge: { callees: ['Layer.merge'] } },
    },
    {
      name: 'a callee left out of provide callees passes',
      code: 'const layer = A.pipe(Layer.provide([B, C]))',
      options: { provide: { callees: ['Effect.provide'] } },
    },
    {
      name: 'one-line merge',
      code: 'const layer = Layer.mergeAll(A, B)',
      errors: ['merge'],
      output: 'const layer = Layer.mergeAll(\n  A,\n  B\n)',
    },
    {
      name: 'one-line provide array in a pipe',
      code: 'const layer = A.pipe(Layer.provide([B, C]))',
      errors: ['provide'],
      output: 'const layer = A.pipe(Layer.provide([\n  B,\n  C\n]))',
    },
    {
      name: 'data-first provide array in the second argument',
      code: 'const layer = Layer.provide(A, [B, C])',
      errors: ['provide'],
      output: 'const layer = Layer.provide(A, [\n  B,\n  C\n])',
    },
    {
      name: 'Effect.provide array',
      code: 'const program = effect.pipe(Effect.provide([A, B]))',
      errors: ['provide'],
      output: 'const program = effect.pipe(Effect.provide([\n  A,\n  B\n]))',
    },
    {
      name: 'Layer.provideMerge array',
      code: 'const layer = A.pipe(Layer.provideMerge([B, C]))',
      errors: ['provide'],
      output: 'const layer = A.pipe(Layer.provideMerge([\n  B,\n  C\n]))',
    },
    {
      name: 'the last layer shares the closing line',
      code: 'const layer = Layer.mergeAll(\n  A,\n  B)',
      errors: ['merge'],
      output: 'const layer = Layer.mergeAll(\n  A,\n  B\n)',
    },
    {
      name: 'a trailing comma stays',
      code: 'const layer = Layer.mergeAll(A, B,)',
      errors: ['merge'],
      output: 'const layer = Layer.mergeAll(\n  A,\n  B,\n)',
    },
    {
      name: 'the fix indents from the line of the bracket',
      code: 'function make() {\n  return Layer.mergeAll(A, B)\n}',
      errors: ['merge'],
      output: 'function make() {\n  return Layer.mergeAll(\n    A,\n    B\n  )\n}',
    },
    {
      name: 'type arguments',
      code: 'const layer = Layer.mergeAll<X>(A, B)',
      errors: ['merge'],
      output: 'const layer = Layer.mergeAll<X>(\n  A,\n  B\n)',
    },
    {
      name: 'a nested merge and provide both split',
      code: 'const layer = Layer.mergeAll(A, B.pipe(Layer.provide([C, D])))',
      errors: ['merge', 'provide'],
      output: 'const layer = Layer.mergeAll(\n  A,\n  B.pipe(Layer.provide([C, D]))\n)',
    },
    {
      name: 'merge min leaves provide min at its default',
      code: 'const layer = Layer.mergeAll(A, B).pipe(Layer.provide([C, D]))',
      options: { merge: { min: 3 } },
      errors: ['provide'],
      output: 'const layer = Layer.mergeAll(A, B).pipe(Layer.provide([\n  C,\n  D\n]))',
    },
    {
      name: 'three layers split under merge min 3',
      code: 'const layer = Layer.mergeAll(A, B, C)',
      options: { merge: { min: 3 } },
      errors: ['merge'],
      output: 'const layer = Layer.mergeAll(\n  A,\n  B,\n  C\n)',
    },
    {
      name: 'three layers split under provide min 3',
      code: 'const layer = A.pipe(Layer.provide([B, C, D]))',
      options: { provide: { min: 3 } },
      errors: ['provide'],
      output: 'const layer = A.pipe(Layer.provide([\n  B,\n  C,\n  D\n]))',
    },
    {
      name: 'indent 4',
      code: 'const layer = Layer.mergeAll(A, B)',
      options: { indent: 4 },
      errors: ['merge'],
      output: 'const layer = Layer.mergeAll(\n    A,\n    B\n)',
    },
    {
      name: 'indent tab',
      code: 'const layer = Layer.mergeAll(A, B)',
      options: { indent: 'tab' },
      errors: ['merge'],
      output: 'const layer = Layer.mergeAll(\n\tA,\n\tB\n)',
    },
    {
      name: 'custom merge and provide callees',
      code: 'const layer = Layer.merge(A, B).pipe(Layer.using([C, D]))',
      options: { merge: { callees: ['Layer.merge'] }, provide: { callees: ['Layer.using'] } },
      errors: ['merge', 'provide'],
      output: 'const layer = Layer.merge(\n  A,\n  B\n).pipe(Layer.using([\n  C,\n  D\n]))',
    },
    { name: 'already fixed', code: 'const layer = Layer.mergeAll(\n  A,\n  B\n)' },
    { name: 'a comment between layers has no fix', code: 'const layer = Layer.mergeAll(A, /* auth */ B)', errors: ['merge'], output: null },
    { name: 'a parenthesized layer has no fix', code: 'const layer = Layer.mergeAll((A), B)', errors: ['merge'], output: null },
    { name: 'an array hole has no fix', code: 'const layer = A.pipe(Layer.provide([B, , C]))', errors: ['provide'], output: null },
  ])('$name', (row) => testerRun(effectLayers, row))
})
