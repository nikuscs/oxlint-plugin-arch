import { test } from 'vitest'
import { noTrivialFunctions } from '../rules/no-trivial-functions.ts'
import { createRuleTester } from './rule-tester.ts'

const error = { messageId: 'trivial' }

test('no-trivial-functions', () => {
  createRuleTester('tsx').run(
    'arch/no-trivial-functions',
    noTrivialFunctions,
    {
      valid: [
        'export function createUser(params: { name: string }) { if (!params.name) { throw new Error(\'missing\') } return saveUser(params) }',
        'export function add(params: { left: number, right: number }) { return params.left + params.right }',
        'export function Title() { return <h1>Title</h1> }',
        'export function makeThing(params: { id: string }) { function inner(value: string) { return fetchValue(value) } return inner(params.id) }',
        {
          code: 'export function makeClient() { return createClient() }',
          options: [{ allowPattern: '^(create|make)[A-Z]' }],
        },
        {
          code: 'export function makeClient() { return createClient() }',
          options: [{ allowPattern: ['^build[A-Z]', '^make[A-Z]'] }],
        },
        {
          code: 'export function loadUser(id: string) { return fetchUser(id) }',
          options: [{ allowCallees: ['^fetchUser$'] }],
        },
        {
          code: 'function loadUser(id: string) { return http.client.get(id) }\nfunction ping() { http.get() }',
          options: [{ allowCallees: ['^http\\.(?:client\\.)?get$'] }],
        },
        {
          code: 'export async function loadUser(id: string) { return await fetchUser(id) }',
          options: [{ allowAsync: true }],
        },
      ],
      invalid: [
        { code: 'export function load() {}', errors: [error] },
        { code: 'export function loadUser(id: string) { return fetchUser(id) }', errors: [error] },
        {
          code: 'export function getDomainIconKey(domainLabel: string): DomainIconKey { return DOMAIN_ICON_BY_LABEL[domainLabel] ?? \'stack\' }',
          errors: [error],
        },
        {
          code: 'function canvasAmountLabel(amount: string | number | null | undefined): string { return formatCurrency({ value: amount, compact: true }).replace(/\\s*kr\\.$/, \'\') }',
          errors: [error],
        },
        { code: 'const toName = (user: User) => user.name', errors: [error] },
        {
          code: 'export function loadUser(id: string) { return otherClient.get(id) }',
          options: [{ allowCallees: ['^http\\.get$'] }],
          errors: [error],
        },
        {
          code: 'export function loadUser(id: string) { return clients[provider].get(id) }',
          options: [{ allowCallees: ['get'] }],
          errors: [error],
        },
        {
          code: 'export async function loadUser(id: string) { return await fetchUser(id) }',
          errors: [error],
        },
        {
          code: 'export async function load() {}',
          options: [{ allowAsync: true }],
          errors: [error],
        },
        {
          code: 'export async function load() { return 1 }',
          options: [{ allowAsync: true }],
          errors: [error],
        },
      ],
    },
  )
})

const precise = [{ mode: 'precise' }]
const guard = { messageId: 'genericGuard' }
const bannedName = { messageId: 'bannedName' }

test('no-trivial-functions precise: meaningful work survives', () => {
  createRuleTester('tsx').run('arch/no-trivial-functions', noTrivialFunctions, {
    valid: [
      'function slug(name: string) { return name.trim().toLowerCase().replaceAll(/ +/g, "-") }',
      'function query(deps: Deps, id: string) { return deps.db.selectFrom("users").where("id", "=", id).execute() }',
      'function prompt(bot: Bot) { return noul(`Is this for ${bot.name}?`, { true: "Names the bot", false: "For another bot" }) }',
      'function prompt(bot: Bot) { return `You are ${bot.name}.` }',
      'function makeServices(deps: Deps) { return createContainer({ db: () => deps.db, mail: () => makeMail(deps) }) }',
      'function makeServices(deps: Deps) { return createContainer(factories(deps)) }',
      'function picks(bots: Bot[]) { return bots.map(bot => ({ id: bot.id, name: bot.name })) }',
      'function roomKey(ids: string[]) { return [...new Set(ids)].sort().join(",") }',
      'function send(params: Params) { return client.send({ id: params.id }) }',
      'function lookup(key: string) { return labels[key] ?? "other" }',
      'function lookup(key: string) { return clients[key].get() }',
      'function optional(value: string) { return client?.send(value) }',
      'function optional(value: string) { return client.send?.(value) }',
      'function reordered(a: string, b: string) { return client.send(b, a) }',
      'function extra(a: string) { return client.send(a, true) }',
      'function defaults(a = now()) { return client.send(a) }',
      'function isRoomOwner(room: Room, user: User) { return room.ownerId === user.id }',
      'function isRecordStoreReady(store: Store) { return store.ready && store.connected }',
      'function predicate(value: User) { return value.kind === "user" }',
      'function parse(value: unknown) { if (typeof value !== "string") { throw new TypeError("bad") } return value.trim() }',
      'function helper(value: unknown) { function nested(value: unknown) { return schema.parse(value) } return nested(value) }',
      'function domain(value: string) { return typeof value === "string" && allowedIds.has(value) }',
      'function shadowed(Array: CustomArray, value: unknown) { return Array.isArray(value) && Array.isValid(value) }',
      'const text = "function isRecord(value) { return typeof value === object }"',
      'import { isRecord } from "external"; use(isRecord)',
      'declare function isRecord(value: unknown): boolean',
      'function objectFactory() { return { fresh: true } }',
    ].map(code => ({ code, options: precise })),
    invalid: [
      { code: 'function alias(params: Params) { return client.load(params) }', errors: [error] },
      { code: 'function alias(deps: Deps, params: Params) { return deps.client.load(params) }', errors: [error] },
      { code: 'function empty() {}', errors: [error] },
      { code: 'function constant() { return "retry now" }', errors: [error] },
      { code: 'const identity = (value: string) => value', errors: [error] },
      { code: 'function retry() { return `retry now` }', errors: [error] },
      { code: 'async function alias(value: string) { return await client.load(value) }', errors: [error] },
      { code: 'export { alias }; function alias(params: Params) { return client.load(params) }', errors: [error] },
      { code: 'export function load(value: string) { return client.load(value) }', errors: [error] },
    ].map(entry => ({ ...entry, options: precise })),
  })
})

test('no-trivial-functions precise: name first and renamed generic guards', () => {
  createRuleTester().run('arch/no-trivial-functions', noTrivialFunctions, {
    valid: [
      { code: 'function isRecord(value: unknown) { return schema.parse({ value }) }', options: [{ mode: 'precise', bannedNames: [] }] },
      { code: 'function isRecord(value: unknown) { return typeof value === "object" }', options: [{ mode: 'precise', allowPattern: '^isRecord$' }] },
      { code: 'function renamed(value: unknown) { return typeof value === "object" }', options: [{ mode: 'precise', checkGenericGuards: false }] },
      { code: 'function send(value: string) { return client.send(value) }', options: [{ mode: 'precise', allowCallees: ['^client.send$'] }] },
      { code: 'async function send(value: string) { return client.send(value) }', options: [{ mode: 'precise', allowAsync: true }] },
    ],
    invalid: [
      ...['isRecord', 'isPlainObject', 'isObject', 'isString', 'isNumber', 'isBoolean', 'isArray', 'asRecord', 'asArray']
        .map(name => ({ code: `function ${name}(value: unknown) { return schema.parse(value) }`, errors: [bannedName] })),
      { code: 'const isRecord = (value: unknown) => typeof value === "object"', errors: [bannedName] },
      { code: 'function outer() { function isRecord(value: unknown) { return typeof value === "object" } return isRecord(input) }', errors: [bannedName] },
      { code: 'function renamed(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value) }', errors: [guard] },
      { code: 'const renamed = (value: unknown) => "string" === typeof value', errors: [guard] },
      { code: 'function renamed(value: unknown) { return Array.isArray(value) }', errors: [guard] },
      { code: 'function renamed(value: unknown) { return typeof value === "string" ? value : "" }', errors: [guard] },
      { code: 'function renamed(value: unknown) { if (typeof value === "string") { return value } return undefined }', errors: [guard] },
      { code: 'function renamed(value: unknown) { const input = value; const valid = typeof input === "object"; return valid && input !== null }', errors: [guard] },
      { code: 'function renamed(record: Record<string, unknown>, key: string) { const value = record[key]; return typeof value === "number" ? value : 0 }', errors: [guard] },
      { code: 'function renamed(value: unknown) { const unused = 1; const another = null; return typeof value === "string" }', errors: [guard] },
      { code: 'function outer() { const renamed = (value: unknown) => typeof value === "string"; return renamed(input) }', errors: [guard] },
      { code: 'const helpers = { isRecord(value: unknown) { return schema.parse(value) } }', errors: [bannedName] },
    ].map(entry => ({ ...entry, options: precise })),
  })
})

test('explicit service method checking rejects wrappers and guards without changing factory methods', () => {
  const options = [{ mode: 'precise', checkServiceMethods: true }]
  createRuleTester().run('arch/no-trivial-functions', noTrivialFunctions, {
    valid: [
      { options, code: 'export const themeService = { themeApply(value) { return save(value.trim()) } }' },
      { options, code: 'export function themeCreate() { const cache = new Map(); return { read(key) { return cache.get(key) } } }' },
      { options: [{ mode: 'precise' }], code: 'export const themeService = { themeApply(value) { return save(value) } }' },
    ],
    invalid: [
      { options, code: 'export const themeService = { themeApply(value) { return save(value) } }', errors: [error] },
      { options, code: 'export const themeService = { themeValue() { return 1 } }', errors: [error] },
      { options, code: 'export const themeService = { themeIsString(value) { return typeof value === "string" } }', errors: [{ messageId: 'genericGuard' }] },
    ],
  })
})
