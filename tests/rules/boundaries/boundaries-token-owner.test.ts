import { describe, it } from 'vitest'
import { boundariesTokenOwner } from '../../../src/rules/boundaries/boundaries-token-owner.ts'
import { testerRun } from '../../utils/tester.utils.ts'

describe('arch/boundaries-token-owner', () => {
  it.each([
    { name: 'unrestricted identifiers pass', code: 'useContext(context)', options: { token: 'createContext' } },
    {
      name: 'allowed suffix owns the token',
      filename: 'src/context.ts',
      code: 'createContext(null)',
      options: { token: 'createContext', allow: ['/context.ts'] },
    },
    {
      name: 'allowed pattern owns the token',
      filename: 'src/context/chat.ts',
      code: 'createContext(null)',
      options: { token: 'createContext', patterns: ['/context/'] },
    },
    { name: 'type-only import passes', code: "import type { Token } from 'lib'", options: { token: 'Token' } },
    { name: 'inline type-only import passes', code: "import { type Token } from 'lib'", options: { token: 'Token' } },
    {
      name: 'member ownership accepts its own suffix',
      filename: 'src/env.ts',
      code: 'process.env.SECRET',
      options: { restrictions: [{ member: 'process.env', allow: ['/env.ts'] }] },
    },
    {
      name: 'restriction patterns own their member',
      filename: 'src/platform/current.ts',
      code: 'process.platform',
      options: { restrictions: [{ member: 'process.platform', patterns: ['/platform/'] }] },
    },
    {
      name: 'the owner file references the token',
      filename: '/repo/apps/web/src/services/rpc.client.ts',
      code: 'type Client = RouterClient<Router>',
      options: { token: 'RouterClient', allow: ['/services/rpc.client.ts'] },
    },
    {
      name: 'a different type name passes',
      filename: '/repo/apps/web/src/hooks/use-client.ts',
      code: 'type Client = OtherClient<Router>',
      options: { token: 'RouterClient', allow: ['/services/rpc.client.ts'] },
    },
    {
      name: 'an unused type-only import passes',
      filename: '/repo/apps/web/src/hooks/use-client.ts',
      code: "import type { RouterClient } from './client.ts'\ntype Client = OtherClient<Router>",
      options: { token: 'RouterClient', allow: ['/services/rpc.client.ts'] },
    },
    {
      name: 'a different value name passes',
      filename: '/repo/apps/web/src/hooks/use-client.ts',
      code: 'const client = OtherClient',
      options: { token: 'RouterClient' },
    },
    {
      name: 'computed member access is ignored',
      filename: '/repo/apps/web/src/platform/current.ts',
      code: "const platform = process.platform\nconst value = db['insertInto']('users')",
      options: { restrictions: [{ token: 'RouterClient', allow: ['/services/rpc.client.ts'] }, { member: 'process.platform', patterns: ['/platform/'] }, { member: '*.insertInto' }] },
    },
    {
      name: 'a type-only import and other receivers pass',
      filename: '/repo/apps/web/src/services/rpc.client.ts',
      code: "import type { RouterClient } from './client.ts'\nconst platform = other.platform",
      options: { restrictions: [{ token: 'RouterClient', allow: ['/services/rpc.client.ts'] }, { member: 'process.platform', patterns: ['/platform/'] }, { member: '*.insertInto' }] },
    },
    { name: 'unowned token', code: 'createContext(null)', options: { token: 'createContext' }, errors: ['restricted'] },
    {
      name: 'type-only imports do not exempt later type references',
      code: "import type { RouterClient } from './client'; type Client = RouterClient<Router>",
      options: { token: 'RouterClient' },
      errors: ['restricted'],
    },
    {
      name: 'suffix exceptions do not cover siblings',
      filename: 'src/context-extra.ts',
      code: 'createContext(null)',
      options: { token: 'createContext', allow: ['/context.ts'] },
      errors: ['restricted'],
    },
    {
      name: 'dotted member includes the custom hint',
      code: 'process.env.SECRET',
      options: { restrictions: [{ member: 'process.env', message: 'Read env.ts.' }] },
      errors: ["'process.env' may only appear in configured owner paths. Read env.ts."],
    },
    {
      name: 'wildcard member matches any receiver',
      code: 'client.execute(query)',
      options: { restrictions: [{ member: '*.execute' }] },
      errors: ['restricted'],
    },
    {
      name: 'wildcard members match chained receivers',
      code: "this.db.insertInto('users'); db.selectFrom('users').insertInto('users')",
      options: { restrictions: [{ member: '*.insertInto' }] },
      errors: ['restricted', 'restricted'],
    },
    {
      name: 'single token combines with restriction entries',
      code: 'createContext(null); process.env.SECRET',
      options: { token: 'createContext', restrictions: [{ member: 'process.env' }] },
      errors: ['restricted', 'restricted'],
    },
    {
      name: 'a non-owner value reference',
      filename: '/repo/apps/web/src/services/other.ts',
      code: 'const client = RouterClient',
      options: { token: 'RouterClient', allow: ['/services/rpc.client.ts'] },
      errors: ['restricted'],
    },
    {
      name: 'a type reference after a type-only import',
      filename: '/repo/apps/web/src/hooks/use-client.ts',
      code: "import type { RouterClient } from './client.ts'\ntype Client = RouterClient<Router>",
      options: { token: 'RouterClient', allow: ['/services/rpc.client.ts'] },
      errors: ['restricted'],
    },
    {
      name: 'a value reference with no owners',
      filename: '/repo/apps/web/src/hooks/use-client.ts',
      code: 'const client = RouterClient',
      options: { token: 'RouterClient' },
      errors: ['restricted'],
    },
    {
      name: 'members restricted across entries',
      filename: '/repo/apps/web/src/hooks/use-client.ts',
      code: "const platform = process.platform\nprocess.platform()\ndb.insertInto('users')\ntrx.insertInto('users')",
      options: { restrictions: [{ token: 'RouterClient', allow: ['/services/rpc.client.ts'] }, { member: 'process.platform', patterns: ['/platform/'] }, { member: '*.insertInto' }] },
      errors: ['restricted', 'restricted', 'restricted', 'restricted'],
    },
    {
      name: 'chained wildcard receivers',
      filename: '/repo/apps/web/src/hooks/use-client.ts',
      code: "this.db.insertInto('users')\ndb.selectFrom('a').insertInto('users')",
      options: { restrictions: [{ token: 'RouterClient', allow: ['/services/rpc.client.ts'] }, { member: 'process.platform', patterns: ['/platform/'] }, { member: '*.insertInto' }] },
      errors: ['restricted', 'restricted'],
    },
    {
      name: 'an owner of one entry only',
      filename: '/repo/apps/web/src/services/rpc.client.ts',
      code: 'const client = RouterClient\nconst platform = process.platform',
      options: { restrictions: [{ token: 'RouterClient', allow: ['/services/rpc.client.ts'] }, { member: 'process.platform', patterns: ['/platform/'] }, { member: '*.insertInto' }] },
      errors: ['restricted'],
    },
    {
      name: 'a token with a messaged member',
      filename: '/repo/apps/web/src/hooks/use-client.ts',
      code: 'const legacy = RouterClient\nconst platform = process.platform',
      options: { token: 'RouterClient', restrictions: [{ member: 'process.platform', message: 'Use the runtime adapter instead.' }] },
      errors: ['restricted', 'restrictedWithMessage'],
    },
  ])('$name', (row) => testerRun(boundariesTokenOwner, row))
})
