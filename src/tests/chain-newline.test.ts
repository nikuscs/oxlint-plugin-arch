import { expect, test } from 'vitest'
import { chainNewline } from '../rules/chain-newline.ts'
import { createRuleTester } from './rule-tester.ts'

type JsonValue = JsonValue[] | { [key: string]: JsonValue } | string | number | boolean | null

const options: JsonValue[] = [{
  groups: [
    {
      minDepth: 3,
      methods: [
        'selectFrom',
        'insertInto',
        'updateTable',
        'deleteFrom',
        'mergeInto',
        'execute',
        'executeTakeFirst',
        'executeTakeFirstOrThrow',
      ],
    },
    {
      minDepth: 2,
      onlyMethods: ['input', 'handler', 'use', 'output'],
      rootPattern: 'Procedure$',
    },
    {
      minDepth: 3,
      methods: [
        'filter',
        'map',
        'flatMap',
        'sort',
        'reduce',
        'reduceRight',
        'find',
        'findIndex',
        'findLast',
        'findLastIndex',
        'some',
        'every',
        'forEach',
      ],
    },
  ],
}]
const error = { messageId: 'newline' }

const queryOutput = 'db\n  .selectFrom("users")\n  .where("active", "=", true)\n  .execute()'
const procedureOutput = 'userProcedure\n  .input(schema)\n  .handler(run)'
const arrayOutput = 'items\n  .filter(active)\n  .map(toName)\n  .sort()'
const optionalOutput = 'items\n  ?.filter(active)\n  .map(toName)\n  .sort()'
const nestedOutput = 'wrap(items\n  .filter(active)\n  .map(toName)\n  .sort())'
const parenOutput = 'await (db as TestDb)\n  .insertInto("users")\n  .values(row)\n  .execute()'

test('chain-newline rejects invalid root patterns during setup', () => {
  expect(() => createRuleTester().run('arch/chain-newline-invalid-regex', chainNewline, {
    valid: [{
      code: 'source.map(fn)',
      options: [{ groups: [{ minDepth: 1, rootPattern: '[' }] }],
    }],
    invalid: [],
  })).toThrow(/Invalid regular expression/)
})

test('chain-newline', () => {
  createRuleTester().run('arch/chain-newline', chainNewline, {
    valid: [
      { code: 'db.selectFrom("users").execute()', options },
      { code: 'service.input(schema).other(run)', options },
      { code: queryOutput, options },
      { code: procedureOutput, options },
      { code: arrayOutput, options },
      { code: optionalOutput, options },
      { code: nestedOutput, options },
      { code: parenOutput, options },
      { code: '(items ?? [])\n  .filter(active)\n  .map(toName)\n  .sort()', options },
      { code: 'const names = (\n  items ??\n  []\n)\n  .filter(active)\n  .map(toName)\n  .sort()', options },
      { code: 'items\n  .filter(active)\n  // keep\n  .map(toName)\n  .sort()', options },
      { code: 'items\n  .filter(active) // keep\n  .map(toName)\n  .sort()', options },
      {
        code: 'items\n\t.filter(active)\n\t.map(toName)\n\t.sort()',
        options: [{ groups: [{ minDepth: 3 }], indent: 'tab' }],
      },
    ],
    invalid: [
      {
        code: 'const names = (\n  items ??\n  []\n).filter(active).map(toName).sort()',
        output: 'const names = (\n  items ??\n  []\n)\n  .filter(active)\n  .map(toName)\n  .sort()',
        options,
        errors: [error],
      },
      {
        code: 'await (db as TestDb).insertInto("users").values(row).execute()',
        output: parenOutput,
        options,
        errors: [error],
      },
      {
        code: 'db.selectFrom("users").where("active", "=", true).execute()',
        output: queryOutput,
        options,
        errors: [error],
      },
      {
        code: 'userProcedure.input(schema).handler(run)',
        output: procedureOutput,
        options,
        errors: [error],
      },
      {
        code: 'jobProcedure.input(schema).handler(run)',
        output: 'jobProcedure\n  .input(schema)\n  .handler(run)',
        options: [{ groups: [{ minDepth: 2, rootPattern: ['^never$', 'Procedure$'] }] }],
        errors: [error],
      },
      {
        code: 'service.input(schema).use(auth).output(result)',
        output: 'service\n  .input(schema)\n  .use(auth)\n  .output(result)',
        options,
        errors: [error],
      },
      {
        code: 'items.filter(active).map(toName).sort()',
        output: arrayOutput,
        options,
        errors: [error],
      },
      {
        code: 'items?.filter(active).map(toName).sort()',
        output: optionalOutput,
        options,
        errors: [error],
      },
      {
        code: 'wrap(items.filter(active).map(toName).sort())',
        output: nestedOutput,
        options,
        errors: [error],
      },
      {
        code: 'items.filter(active)[method]().sort()',
        output: null,
        options: [{ groups: [{ minDepth: 3 }] }],
        errors: [error],
      },
      {
        code: 'items.filter(active) /* keep this link */.map(toName).sort()',
        output: null,
        options: [{ groups: [{ minDepth: 3 }] }],
        errors: [error],
      },
      {
        code: 'items.filter(active).map(toName).sort()',
        output: 'items\n\t.filter(active)\n\t.map(toName)\n\t.sort()',
        options: [{ groups: [{ minDepth: 3 }], indent: 'tab' }],
        errors: [error],
      },
    ],
  })
})
