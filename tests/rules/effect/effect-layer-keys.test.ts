import { describe, it } from 'vitest'
import { effectLayerKeys } from '../../../src/rules/effect/effect-layer-keys.ts'
import { testerRun } from '../../utils/tester.utils.ts'

describe('arch/effect-layer-keys', () => {
  it.each([
    {
      name: 'the layer binds every declared method',
      filename: 'server/order/order.layer.ts',
      files: {
        'contract/order/order.service.ts': [
          'export class Orders extends Context.Service<Orders, {',
          '  readonly create: (params: OrderCreateParams) => Effect.Effect<Output, Errors.NotFound>;',
          '  // readonly ghost: () => void',
          '  readonly schedule: {',
          '    readonly cancel: (params: { id: number }) => Effect.Effect<',
          '      Output,',
          '      Errors.NotFound',
          '    >;',
          '  };',
          '  list(params: Params): Effect.Effect<Output>;',
          "}>()('@app/contract/order/order.service/Orders') {}",
          'export interface OrderCreateParams { readonly other: string }',
        ].join('\n'),
      },
      code: 'Kit.bind({ create: a, schedule: { cancel: b }, list: c })',
      options: { service: '<root>/contract/{folder}/{folder}.service.ts' },
    },
    {
      name: 'a method typed by a reference may be bound as an object',
      filename: 'server/order/order.layer.ts',
      files: { 'contract/order/order.service.ts': 'class Orders extends Context.Service<Orders, { readonly channels: Kit.Channels<A, B>; readonly list: () => void }>()("k") {}' },
      code: 'Orders.of({ channels: { authorize: a }, list: b })',
      options: { service: '<root>/contract/{folder}/{folder}.service.ts' },
    },
    {
      name: 'an overloaded method is one key',
      filename: 'server/order/order.layer.ts',
      files: { 'contract/order/order.service.ts': 'class Orders extends Context.Service<Orders, { readonly get: { <K>(params: P<K>): R<K>; (params: Q): S }; readonly list: () => void }>()("k") {}' },
      code: 'Kit.bind({ get: a, list: b })',
      options: { service: '<root>/contract/{folder}/{folder}.service.ts' },
    },
    {
      name: 'a missing service file checks nothing',
      filename: 'server/order/order.layer.ts',
      files: {},
      code: 'Kit.bind({ anything: a })',
      options: { service: '<root>/contract/{folder}/{folder}.service.ts' },
    },
    {
      name: 'an unlisted callee is not a layer',
      filename: 'server/order/order.layer.ts',
      files: { 'contract/order/order.service.ts': 'class Orders extends Context.Service<Orders, { readonly create: () => void }>()("k") {}' },
      code: 'other({ wrong: a })',
      options: { service: '<root>/contract/{folder}/{folder}.service.ts', callees: ['Kit.bind'] },
    },
    {
      name: 'another declaration name is read',
      filename: 'server/order/order.layer.ts',
      files: { 'contract/order/order.service.ts': 'class Orders extends Context.Tag("k")<Orders, { readonly create: () => void }>() {}' },
      code: 'Orders.of({ create: a })',
      options: { service: '<root>/contract/{folder}/{folder}.service.ts', declaration: 'Context.Tag("k")' },
    },
    {
      name: 'a key the service does not declare',
      filename: 'server/order/order.layer.ts',
      files: { 'contract/order/order.service.ts': 'class Orders extends Context.Service<Orders, { readonly create: () => void }>()("k") {}' },
      code: 'Kit.bind({ create: a, remove: b })',
      options: { service: '<root>/contract/{folder}/{folder}.service.ts' },
      errors: ["'remove' is not a method of the service declared in order/order.service.ts."],
    },
    {
      name: 'a nested key the service does not declare',
      filename: 'server/order/order.layer.ts',
      files: { 'contract/order/order.service.ts': 'class Orders extends Context.Service<Orders, { readonly schedule: { readonly cancel: () => void } }>()("k") {}' },
      code: 'Kit.bind({ schedule: { cancel: a, pause: b } })',
      options: { service: '<root>/contract/{folder}/{folder}.service.ts' },
      errors: ['extra'],
    },
    {
      name: 'a declared method the layer does not bind',
      filename: 'server/order/order.layer.ts',
      files: { 'contract/order/order.service.ts': 'class Orders extends Context.Service<Orders, { readonly create: () => void; readonly list: () => void; readonly schedule: { readonly cancel: () => void } }>()("k") {}' },
      code: 'Kit.bind({ create: a })',
      options: { service: '<root>/contract/{folder}/{folder}.service.ts' },
      errors: ["The service in order/order.service.ts declares 'list', 'schedule.cancel', which this layer does not bind."],
    },
    {
      name: 'a group bound as one value',
      filename: 'server/order/order.layer.ts',
      files: { 'contract/order/order.service.ts': 'class Orders extends Context.Service<Orders, { readonly schedule: { readonly cancel: () => void } }>()("k") {}' },
      code: 'Kit.bind({ schedule: group })',
      options: { service: '<root>/contract/{folder}/{folder}.service.ts' },
      errors: ['missing', 'extra'],
    },
    { name: 'a missing service is skipped by default', filename: 'server/order/order.layer.ts', files: {}, code: 'Orders.of({ create })', options: { service: '../../contract/{folder}/{folder}.service.ts' } },
    {
      name: 'a missing service reports when asked',
      filename: 'server/order/order.layer.ts',
      files: {},
      code: 'Orders.of({ create })',
      options: { service: '../../contract/{folder}/{folder}.service.ts', missing: 'error', message: 'Add the service first.' },
      errors: ['This layer needs its service declared in order/order.service.ts. Add the service first.'],
    },
    {
      name: 'the message names the extra key path',
      filename: 'server/order/order.layer.ts',
      files: { 'contract/order/order.service.ts': 'class Orders extends Context.Service<Orders, { readonly schedule: { readonly cancel: () => void } }>()("k") {}' },
      code: 'Kit.bind({ schedule: { cancel: a, pause: b } })',
      options: { service: '<root>/contract/{folder}/{folder}.service.ts', message: 'Declare {folder}{Path} on the service first.' },
      errors: ["'schedule.pause' is not a method of the service declared in order/order.service.ts. Declare orderSchedulePause on the service first."],
    },
  ])('$name', (row) => testerRun(effectLayerKeys, row))
})
