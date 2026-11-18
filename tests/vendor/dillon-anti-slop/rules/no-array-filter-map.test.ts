import { describe, it } from 'vitest'
import { noArrayFilterMapRule } from '../../../../src/vendor/dillon-anti-slop/rules/no-array-filter-map.ts'
import { testerRun } from '../../../utils/tester.utils.ts'

describe('dillon-anti-slop/no-array-filter-map', () => {
  it.each([
    { name: 'a lazy filter then map passes', code: 'const users = []; users.values().filter(active).map(email).toArray();' },
    { name: 'a lazy map then filter passes', code: 'const users = []; users.values().map(email).filter(Boolean).toArray();' },
    { name: 'an iterator pipeline passes', code: 'Iterator.from(users).filter(active).map(email).toArray();' },
    { name: 'an iterator parameter passes', code: 'function collect(users: IteratorObject<User>) { return users.filter(active).map(email).toArray(); }' },
    { name: 'a single flatMap passes', code: 'const users = []; users.flatMap(user => user.active ? [user.email] : []);' },
    { name: 'separate passes on separate statements pass', code: 'const users = []; users.map(email); users.filter(active);' },
    { name: 'two maps pass', code: 'const users = []; users.map(email).map(normalize);' },
    { name: 'two filters pass', code: 'const users = []; users.filter(active).filter(verified);' },
    { name: 'a custom receiver passes', code: 'const custom = { filter() { return this; }, map() {} }; custom.filter(active).map(email);' },
    { name: 'an unknown receiver passes', code: 'function collect(unknownReceiver) { return unknownReceiver.filter(active).map(email); }' },
    { name: 'an unknown call result passes', code: 'const users = fetchUsers(); users.filter(active).map(email);' },
    { name: 'a shadowing untyped parameter passes', code: 'const users = []; function collect(users) { return users.filter(active).map(email); }' },
    { name: 'a reassigned binding passes', code: 'let users = []; users = iterator; users.filter(active).map(email);' },
    { name: 'a computed dynamic method passes', code: 'const users = []; users[method](active).map(email);' },
    { name: 'a circular alias passes', code: 'const first = second; const second = first; first.filter(active).map(email);' },
    { name: 'filter then map on a literal fails', code: '[].filter(active).map(email);', errors: ['arrayFilterMap'] },
    { name: 'map then filter on a literal fails', code: '[].map(user => user.active ? user.email : undefined).filter(email => email !== undefined);', errors: ['arrayFilterMap'] },
    { name: 'map then filter on a const array fails', code: 'const users = []; users.map(email).filter(Boolean);', errors: ['arrayFilterMap'] },
    { name: 'an alias of a const array fails', code: 'const users = []; const alias = users; alias.filter(active).map(email);', errors: ['arrayFilterMap'] },
    { name: 'an array parameter fails', code: 'function collect(users: User[]) { return users.filter(active).map(email); }', errors: ['arrayFilterMap'] },
    { name: 'a readonly array parameter fails', code: 'function collect(users: readonly User[]) { return users.map(email).filter(present); }', errors: ['arrayFilterMap'] },
    { name: 'a ReadonlyArray parameter fails', code: 'function collect(users: ReadonlyArray<User>) { return users.filter(active).map(email); }', errors: ['arrayFilterMap'] },
    { name: 'an Array parameter fails', code: 'function collect(users: Array<User>) { return users.filter(active).map(email); }', errors: ['arrayFilterMap'] },
    { name: 'computed string methods fail', code: "const users = [] as const; users['filter'](active)['map'](email);", errors: ['arrayFilterMap'] },
    { name: 'a non-null wrapped pass fails', code: 'const users = []; (users.filter(active)!).map(email);', errors: ['arrayFilterMap'] },
    { name: 'optional chaining fails', code: 'const users = []; users?.filter(active)?.map(email);', errors: ['arrayFilterMap'] },
    { name: 'an array copy then filter and map fails', code: 'const users = []; users.slice().filter(active).map(email);', errors: ['arrayFilterMap'] },
    { name: 'each adjacent pair fails', code: 'const users = []; users.filter(active).map(email).filter(Boolean);', errors: ['arrayFilterMap', 'arrayFilterMap'] },
    { name: 'a local ReadonlyArray type passes', code: 'type ReadonlyArray<T> = IteratorObject<T>; function lazy(values: ReadonlyArray<number>) { return values.filter(active).map(email) }' },
  ])('$name', (row) => testerRun(noArrayFilterMapRule, row))
})
