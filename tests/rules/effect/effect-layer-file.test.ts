import { describe, it } from 'vitest'
import { effectLayerFile } from '../../../src/rules/effect/effect-layer-file.ts'
import { testerRun } from '../../utils/tester.utils.ts'

describe('arch/effect-layer-file', () => {
  it.each([
    {
      name: 'a layer built from make passes',
      code: 'const make = Effect.gen(function* () {\n  return Users.of({ get })\n})\nexport const layer = Layer.effect(Users, make)',
    },
    {
      name: 'local layers named layer<Role> pass',
      code: 'const make = Effect.gen(function* () {\n  return Users.of({})\n})\nconst layerBase = Layer.effect(Users, make)\nexport const layer = layerBase.pipe(Layer.provide(Db.layer))',
    },
    { name: 'a layer pipe passes', code: 'export const layer = Users.layer.pipe(Layer.provide(Db.layer))' },
    { name: 'a function returning a layer passes', code: 'export const layer = (url) => Layer.succeed(Config, { url })' },
    { name: 'a function returning a router route passes', code: "export const layer = (options) => HttpRouter.add('*', '/rpc', handler)" },
    { name: 'a block function returning a layer passes', code: 'export const layer = (url) => {\n  return Layer.succeed(Config, { url })\n}' },
    { name: 'make returning a Context passes', code: 'const make = Effect.gen(function* () {\n  return Context.make(Users, {})\n})\nexport const layer = Layer.effectContext(make)' },
    { name: 'a missing layer', code: 'export const users = 1', errors: ['missing'] },
    { name: 'a layer not built with Layer', code: 'export const layer = 1', errors: ['notLayer'] },
    {
      name: 'the builder is named make',
      code: 'const build = Effect.gen(function* () {\n  return Users.of({})\n})\nexport const layer = Layer.effect(Users, build)',
      errors: ['builderName'],
    },
    {
      name: 'a second module Effect',
      code: 'const make = Effect.gen(function* () {\n  return Users.of({})\n})\nconst load = Effect.gen(function* () {})\nexport const layer = Layer.effect(Users, make)',
      errors: ['moduleMethod'],
    },
    {
      name: 'a module helper',
      code: 'const max = 3\nconst make = Effect.gen(function* () {\n  return Users.of({})\n})\nexport const layer = Layer.effect(Users, make)',
      errors: ['moduleHelper'],
    },
    { name: 'a function declaration is a module helper', code: 'function load() {}\nexport const layer = Users.layer', errors: ['moduleHelper'] },
    { name: 'a local layer without the prefix', code: 'const base = Layer.succeed(Config, {})\nexport const layer = Layer.merge(base, Db.layer)', errors: ['localLayer'] },
    { name: 'an exported layer<Role>', code: 'export const layerTest = Layer.succeed(Config, {})\nexport const layer = layerTest', errors: ['localLayer'] },
    {
      name: 'make returning a plain object',
      code: 'const make = Effect.gen(function* () {\n  return { get }\n})\nexport const layer = Layer.effect(Users, make)',
      errors: ['makeReturn'],
    },
    {
      name: 'an inline builder',
      code: 'export const layer = Layer.effect(Users, Effect.gen(function* () {\n  return Users.of({})\n}))',
      errors: ['inlineBuilder'],
    },
    { name: 'an inline function builder', code: 'export const layer = Layer.sync(Users, () => Users.of({}))', errors: ['inlineBuilder'] },
    {
      name: 'the message names the configured layer',
      code: 'export const users = 1',
      options: { layer: 'live' },
      errors: ['A layer file exports `live`.'],
    },
    {
      name: 'custom layer, make and prefix names',
      code: 'const build = Effect.gen(function* () {\n  return Users.of({})\n})\nconst liveBase = Layer.effect(Users, build)\nexport const live = liveBase',
      options: { layer: 'live', make: 'build', prefix: 'live', layers: ['^Layer\\.', '(?:^|\\.)live[^.]*$'] },
    },
    {
      name: 'a suffix names local layers <Role>Layer',
      code: 'const make = Effect.gen(function* () {\n  return Users.of({})\n})\nconst UsersLayer = Layer.effect(Users, make)\nexport const layer = UsersLayer.pipe(Layer.provide(Db.layer))',
      options: { suffix: 'Layer' },
    },
    { name: 'a suffix recognises a service layer call', code: 'const AuthLayer = Auth.layer({})\nexport const layer = Layer.provide(AuthLayer, Db.layer)', options: { suffix: 'Layer' } },
    {
      name: 'a suffix rejects layer<Role>',
      code: 'const layerAuth = Auth.layer({})\nexport const layer = Layer.provide(layerAuth, Db.layer)',
      options: { suffix: 'Layer' },
      errors: ['A Layer other than `layer` is named <Role>Layer and is not exported.'],
    },
    { name: 'a suffix rejects a plain name', code: 'const auth = Auth.layer({})\nexport const layer = Layer.provide(auth, Db.layer)', options: { suffix: 'Layer' }, errors: ['localLayer'] },
    { name: 'a suffix rejects a lowercase role', code: 'const authLayer = Auth.layer({})\nexport const layer = authLayer', options: { suffix: 'Layer' }, errors: ['localLayer'] },
    { name: 'a suffix rejects an exported local layer', code: 'export const AuthLayer = Auth.layer({})\nexport const layer = AuthLayer', options: { suffix: 'Layer' }, errors: ['localLayer'] },
    {
      name: 'custom builders',
      code: 'const make = Task.make(function* () {\n  return Users.of({})\n})\nexport const layer = Layer.effect(Users, make)',
      options: { builders: ['Task.make'] },
    },
    {
      name: 'custom services',
      code: 'const make = Effect.gen(function* () {\n  return Users.create({})\n})\nexport const layer = Layer.effect(Users, make)',
      options: { services: ['\\.create$'] },
    },
    {
      name: 'custom constructors',
      code: 'export const layer = Layer.custom(Users, () => Users.of({}))',
      options: { constructors: ['Layer.custom'] },
      errors: ['inlineBuilder'],
    },
    { name: 'constructors replace the defaults', code: 'export const layer = Layer.sync(Users, () => Users.of({}))', options: { constructors: ['Layer.custom'] } },
  ])('$name', (row) => testerRun(effectLayerFile, row))
})
