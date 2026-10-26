import { describe, it } from 'vitest'
import { codePairedCall } from '../../../src/rules/code/code-paired-call.ts'
import { testerRun } from '../../utils/tester.utils.ts'

describe('arch/code-paired-call', () => {
  it.each([
    { name: 'unrelated calls pass', code: 'run()', options: { when: 'start', require: 'finish' } },
    { name: 'required call may precede trigger', code: 'finish(); start()', options: { when: 'start', require: 'finish' } },
    { name: 'nested partner call passes', code: 'start(finish())', options: { when: 'start', require: 'finish' } },
    {
      name: 'method names match without the receiver',
      code: 'vi.useFakeTimers(); run(); vi.useRealTimers()',
      options: { pairs: [{ when: 'useFakeTimers', require: 'useRealTimers' }] },
    },
    {
      name: 'both import aliases resolve',
      code: "import { start as begin, finish as end } from 'tools'\nbegin(); end()",
      options: { when: 'start', require: 'finish' },
    },
    {
      name: 'all configured pairs can be satisfied',
      code: 'start(); finish(); track(); flush()',
      options: { pairs: [{ when: 'start', require: 'finish' }, { when: 'track', require: 'flush' }] },
    },
    {
      name: 'a partner call through a binding passes',
      code: 'const resolver = standardSchemaResolver(schema)\nuseForm({ resolver })',
      options: { when: 'useForm', require: 'standardSchemaResolver' },
    },
    {
      name: 'an inline partner call passes',
      code: 'useForm({ resolver: standardSchemaResolver(schema) })',
      options: { when: 'useForm', require: 'standardSchemaResolver' },
    },
    { name: 'an unrelated call passes', code: 'const value = otherCall()', options: { when: 'useForm', require: 'standardSchemaResolver' } },
    {
      name: 'aliased imports pass',
      code: "import { useForm as useF, standardSchemaResolver as resolve } from 'form'\nuseF({ resolver: resolve(schema) })",
      options: { when: 'useForm', require: 'standardSchemaResolver' },
    },
    {
      name: 'several satisfied pairs pass',
      code: 'useForm({ resolver: standardSchemaResolver(schema) })\ntrackEvent()\nflushEvents()',
      options: { pairs: [{ when: 'useForm', require: 'standardSchemaResolver' }, { when: 'trackEvent', require: 'flushEvents' }] },
    },
    {
      name: 'several aliased pairs pass',
      code: "import { useForm as useF, standardSchemaResolver as resolve, trackEvent as track, flushEvents as flush } from 'tools'\nuseF({ resolver: resolve(schema) })\ntrack()\nflush()",
      options: { pairs: [{ when: 'useForm', require: 'standardSchemaResolver' }, { when: 'trackEvent', require: 'flushEvents' }] },
    },
    {
      name: 'a single pair plus pairs passes',
      code: 'useForm()\nstandardSchemaResolver(schema)\ntrackEvent()\nflushEvents()',
      options: { when: 'useForm', require: 'standardSchemaResolver', pairs: [{ when: 'trackEvent', require: 'flushEvents' }] },
    },
    { name: 'missing partner fails', code: 'start()', options: { when: 'start', require: 'finish' }, errors: ['paired'] },
    { name: 'repeated triggers report once', code: 'start(); start()', options: { when: 'start', require: 'finish' }, errors: ['paired'] },
    { name: 'reference is not a partner call', code: 'start(finish)', options: { when: 'start', require: 'finish' }, errors: ['paired'] },
    {
      name: 'aliased trigger still requires its partner',
      code: "import { start as begin } from 'tools'\nbegin()",
      options: { when: 'start', require: 'finish' },
      errors: ['paired'],
    },
    {
      name: 'each unsatisfied pair reports',
      code: 'start(); track()',
      options: { pairs: [{ when: 'start', require: 'finish' }, { when: 'track', require: 'flush' }] },
      errors: ['paired', 'paired'],
    },
    {
      name: 'single pair and pair list are combined',
      code: 'start(); finish(); track()',
      options: { when: 'start', require: 'finish', pairs: [{ when: 'track', require: 'flush' }] },
      errors: ['paired'],
    },
    {
      name: 'a trigger without its partner',
      code: 'useForm({ defaultValues: {} })',
      options: { when: 'useForm', require: 'standardSchemaResolver' },
      errors: ['paired'],
    },
    {
      name: 'two triggers without a partner',
      code: 'const first = useForm({})\nconst second = useForm({})',
      options: { when: 'useForm', require: 'standardSchemaResolver' },
      errors: ['paired'],
    },
    {
      name: 'an aliased trigger without its partner',
      code: "import { useForm as useF } from 'form'\nuseF({ defaultValues: {} })",
      options: { when: 'useForm', require: 'standardSchemaResolver' },
      errors: ['paired'],
    },
    {
      name: 'one unsatisfied pair of two',
      code: 'useForm()\nstandardSchemaResolver(schema)\ntrackEvent()',
      options: { pairs: [{ when: 'useForm', require: 'standardSchemaResolver' }, { when: 'trackEvent', require: 'flushEvents' }] },
      errors: ['paired'],
    },
    {
      name: 'two unsatisfied pairs',
      code: 'useForm()\ntrackEvent()',
      options: { pairs: [{ when: 'useForm', require: 'standardSchemaResolver' }, { when: 'trackEvent', require: 'flushEvents' }] },
      errors: ['paired', 'paired'],
    },
    {
      name: 'an unsatisfied single pair beside pairs',
      code: 'useForm()\ntrackEvent()\nflushEvents()',
      options: { when: 'useForm', require: 'standardSchemaResolver', pairs: [{ when: 'trackEvent', require: 'flushEvents' }] },
      errors: ['paired'],
    },
  ])('$name', (row) => testerRun(codePairedCall, row))
})
