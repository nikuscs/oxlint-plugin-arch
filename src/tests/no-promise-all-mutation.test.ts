import { test } from 'vitest'
import { noPromiseAllMutation } from '../rules/no-promise-all-mutation.ts'
import { createRuleTester } from './rule-tester.ts'

const mutation = { messageId: 'mutation' }

test('no-promise-all-mutation', () => {
  createRuleTester().run('arch/no-promise-all-mutation', noPromiseAllMutation, {
    valid: [
      'const results = []; results.push(1); await Promise.all(items.map(async item => load(item))); results.push(2)',
      'await Promise.all(items.map(async item => { const results = []; results.push(await load(item)); return results }))',
      'await Promise.all(items.map(async (item, count) => { count++; return load(item) }))',
      'await Promise.all([(() => { const map = new Map(); map.set("key", 1); return map })()])',
      'const results = []; await queue.all(items.map(async item => results.push(await load(item))))',
      'const results = []; await Promise.all(items.map(async item => results.concat(await load(item))))',
      {
        code: 'let total = 0; await Promise.all(items.map(async item => { total += await load(item) }))',
        options: [
          {
            combinators: ['Promise.all'],
            methods: ['push'],
            checkAssignments: false,
          },
        ],
      },
      {
        code: 'const results = []; await Promise.all(items.map(async item => results.push(await load(item))))',
        options: [
          {
            combinators: ['batch.run'],
            methods: ['append'],
            checkAssignments: true,
          },
        ],
      },
    ],
    invalid: [
      {
        code: 'const results = []; await Promise.all(items.map(async item => results.push(await load(item))))',
        errors: [mutation],
      },
      {
        code: 'const results = []; await Promise.allSettled([load(1).then(value => results.unshift(value))])',
        errors: [mutation],
      },
      {
        code: 'const seen = new Set(); await Promise.any(items.map(async item => { seen.add(item); return load(item) }))',
        errors: [mutation],
      },
      {
        code: 'const values = new Map(); await Promise.race(items.map(async item => { values.set(item, await load(item)) }))',
        errors: [mutation],
      },
      {
        code: 'let total = 0; await Promise.all(items.map(async item => { total += await load(item) }))',
        errors: [mutation],
      },
      {
        code: 'const acc = {}; await Promise.all(items.map(async item => { acc[item.id] = await load(item) }))',
        errors: [mutation],
      },
      {
        code: 'let count = 0; await Promise.all(items.map(async item => { count++; return load(item) }))',
        errors: [mutation],
      },
      {
        code: 'const results = []; const output = results; await Promise.all(items.map(async item => output.push(await load(item))))',
        errors: [mutation],
      },
      {
        code: 'const state = { results: [] }; await Promise.all([state.results.splice(0, 0, 1)])',
        errors: [mutation],
      },
      {
        code: 'const results = []; await batch.run(items.map(async item => results.append(await load(item))))',
        options: [
          {
            combinators: ['batch.run'],
            methods: ['append'],
            checkAssignments: false,
          },
        ],
        errors: [mutation],
      },
      {
        code: 'const results = []; await Promise.all([results.push(1)])',
        errors: [mutation],
      },
      {
        code: 'let total = 0; await Promise.all(items.map(async item => { [total] = await load(item) }))',
        errors: [mutation],
      },
      {
        code: 'let total = 0; await Promise.all(items.map(async item => { ({ total } = await load(item)) }))',
        errors: [mutation],
      },
      {
        code: 'let total = 0; await Promise.all(items.map(async item => { [total = 0] = await load(item) }))',
        errors: [mutation],
      },
      {
        code: 'let rest = []; await Promise.all(items.map(async item => { [...rest] = await load(item) }))',
        errors: [mutation],
      },
      {
        code: 'let rest = {}; await Promise.all(items.map(async item => { ({ ...rest } = await load(item)) }))',
        errors: [mutation],
      },
      {
        code: 'const acc = {}; await Promise.all(items.map(async item => { ({ value: acc.id } = await load(item)) }))',
        errors: [mutation],
      },
    ],
  })
})
