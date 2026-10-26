import { describe, it } from 'vitest'
import { testerRun } from '../../utils/tester.utils.ts'
import { codePromiseMutation } from './code-promise-mutation.ts'

describe('arch/code-promise-mutation', () => {
  it.each([
    { name: 'returning results passes', code: 'const users = await Promise.all(ids.map((id) => load(id)))' },
    { name: 'mutations outside the combinator pass', code: 'const results = []; results.push(1); await Promise.all(tasks); results.push(2)' },
    {
      name: 'callback-local binding passes',
      code: 'await Promise.all(items.map(async item => { const results = []; results.push(await load(item)); return results }))',
    },
    { name: 'callback parameter mutation passes', code: 'await Promise.all(items.map(async (item, count) => { count++; return load(item) }))' },
    { name: 'unresolved globals are ignored', code: 'await Promise.all([results.push(1)])' },
    { name: 'unlisted combinator passes', code: 'const results = []; await queue.all([results.push(1)])' },
    { name: 'nonmutating method passes', code: 'const results = []; await Promise.all([results.concat(1)])' },
    { name: 'assignments can be disabled', code: 'let total = 0; await Promise.all([total += 1])', options: { assignments: false } },
    { name: 'method list replaces defaults', code: 'const results = []; await Promise.all([results.push(1)])', options: { methods: ['append'] } },
    { name: 'combinator list replaces defaults', code: 'const results = []; await Promise.all([results.push(1)])', options: { combinators: ['batch.run'] } },
    {
      name: 'a push outside the combinator passes',
      code: 'const results = []; results.push(1); await Promise.all(items.map(async item => load(item))); results.push(2)',
    },
    { name: 'a local map inside the combinator passes', code: 'await Promise.all([(() => { const map = new Map(); map.set("key", 1); return map })()])' },
    { name: 'an unlisted combinator passes', code: 'const results = []; await queue.all(items.map(async item => results.push(await load(item))))' },
    { name: 'a non-mutating concat passes', code: 'const results = []; await Promise.all(items.map(async item => results.concat(await load(item))))' },
    {
      name: 'assignments off passes a compound assignment',
      code: 'let total = 0; await Promise.all(items.map(async item => { total += await load(item) }))',
      options: { combinators: ['Promise.all'], methods: ['push'], assignments: false },
    },
    {
      name: 'custom combinators skip Promise.all',
      code: 'const results = []; await Promise.all(items.map(async item => results.push(await load(item))))',
      options: { combinators: ['batch.run'], methods: ['append'], assignments: true },
    },
    {
      name: 'async push to outer binding fails',
      code: 'const users = []; await Promise.all(ids.map(async id => users.push(await load(id))))',
      errors: ['mutation'],
    },
    { name: 'synchronous argument mutation fails', code: 'const users = []; await Promise.all([Promise.resolve(users.push(user))])', errors: ['mutation'] },
    { name: 'allSettled is checked', code: 'const results = []; await Promise.allSettled([results.unshift(1)])', errors: ['mutation'] },
    { name: 'any is checked', code: 'const seen = new Set(); await Promise.any([seen.add(1)])', errors: ['mutation'] },
    { name: 'race is checked', code: 'const values = new Map(); await Promise.race([values.set("key", 1)])', errors: ['mutation'] },
    { name: 'compound assignment fails', code: 'let total = 0; await Promise.all([total += 1])', errors: ['mutation'] },
    { name: 'member assignment fails', code: 'const state = {}; await Promise.all([state.value = 1])', errors: ['mutation'] },
    { name: 'update expression fails', code: 'let count = 0; await Promise.all([count++])', errors: ['mutation'] },
    { name: 'nested member mutation fails', code: 'const state = { results: [] }; await Promise.all([state.results.splice(0, 0, 1)])', errors: ['mutation'] },
    { name: 'array assignment is checked', code: 'let total = 0; await Promise.all([([total = 0] = values)])', errors: ['mutation'] },
    { name: 'object assignment is checked', code: 'let total = 0; await Promise.all([({ total } = values)])', errors: ['mutation'] },
    { name: 'array rest assignment is checked', code: 'let rest = []; await Promise.all([([...rest] = values)])', errors: ['mutation'] },
    { name: 'object rest assignment is checked', code: 'let rest = {}; await Promise.all([({ ...rest } = values)])', errors: ['mutation'] },
    { name: 'destructured member assignment is checked', code: 'const state = {}; await Promise.all([({ value: state.id } = values)])', errors: ['mutation'] },
    {
      name: 'custom combinator and method are checked',
      code: 'const results = []; await batch.run([results.append(1)])',
      options: { combinators: ['batch.run'], methods: ['append'], assignments: false },
      errors: ['mutation'],
    },
    {
      name: 'nested combinators do not duplicate a report',
      code: 'const results = []; await Promise.all([Promise.all([results.push(1)])])',
      errors: ['mutation'],
    },
    {
      name: 'separate mutations each report',
      code: 'const results = []; let count = 0; await Promise.all([results.push(1), count++])',
      errors: ['mutation', 'mutation'],
    },
    {
      name: 'a push from Promise.all',
      code: 'const results = []; await Promise.all(items.map(async item => results.push(await load(item))))',
      errors: ['mutation'],
    },
    {
      name: 'an unshift from Promise.allSettled',
      code: 'const results = []; await Promise.allSettled([load(1).then(value => results.unshift(value))])',
      errors: ['mutation'],
    },
    {
      name: 'a set add from Promise.any',
      code: 'const seen = new Set(); await Promise.any(items.map(async item => { seen.add(item); return load(item) }))',
      errors: ['mutation'],
    },
    {
      name: 'a map set from Promise.race',
      code: 'const values = new Map(); await Promise.race(items.map(async item => { values.set(item, await load(item)) }))',
      errors: ['mutation'],
    },
    { name: 'a compound assignment', code: 'let total = 0; await Promise.all(items.map(async item => { total += await load(item) }))', errors: ['mutation'] },
    {
      name: 'a computed member assignment',
      code: 'const acc = {}; await Promise.all(items.map(async item => { acc[item.id] = await load(item) }))',
      errors: ['mutation'],
    },
    { name: 'an update expression', code: 'let count = 0; await Promise.all(items.map(async item => { count++; return load(item) }))', errors: ['mutation'] },
    {
      name: 'a push through an alias',
      code: 'const results = []; const output = results; await Promise.all(items.map(async item => output.push(await load(item))))',
      errors: ['mutation'],
    },
    {
      name: 'a custom combinator and method',
      code: 'const results = []; await batch.run(items.map(async item => results.append(await load(item))))',
      options: { combinators: ['batch.run'], methods: ['append'], assignments: false },
      errors: ['mutation'],
    },
    {
      name: 'an array destructuring assignment',
      code: 'let total = 0; await Promise.all(items.map(async item => { [total] = await load(item) }))',
      errors: ['mutation'],
    },
    {
      name: 'an object destructuring assignment',
      code: 'let total = 0; await Promise.all(items.map(async item => { ({ total } = await load(item)) }))',
      errors: ['mutation'],
    },
    {
      name: 'a defaulted destructuring assignment',
      code: 'let total = 0; await Promise.all(items.map(async item => { [total = 0] = await load(item) }))',
      errors: ['mutation'],
    },
    {
      name: 'an array rest assignment',
      code: 'let rest = []; await Promise.all(items.map(async item => { [...rest] = await load(item) }))',
      errors: ['mutation'],
    },
    {
      name: 'an object rest assignment',
      code: 'let rest = {}; await Promise.all(items.map(async item => { ({ ...rest } = await load(item)) }))',
      errors: ['mutation'],
    },
    {
      name: 'a member target in destructuring',
      code: 'const acc = {}; await Promise.all(items.map(async item => { ({ value: acc.id } = await load(item)) }))',
      errors: ['mutation'],
    },
  ])('$name', (row) => testerRun(codePromiseMutation, row))
})
