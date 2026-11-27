import { describe, it } from 'vitest'
import { effectServiceParams } from '../../../src/rules/effect/effect-service-params.ts'
import { testerRun } from '../../utils/tester.utils.ts'

describe('arch/effect-service-params', () => {
  it.each([
    {
      name: 'a params type of the domain',
      filename: 'src/order/order.service.ts',
      code: "class Orders extends Context.Service<Orders, { readonly create: (params: OrderCreateParams) => Effect.Effect<void> }>()('key') {}",
    },
    {
      name: 'a params type shared by two methods',
      filename: 'src/order/order.service.ts',
      code: "class Orders extends Context.Service<Orders, { readonly ban: (params: OrderIdParams) => void; readonly unban: (params: OrderIdParams) => void }>()('key') {}",
    },
    {
      name: 'a nested group',
      filename: 'src/order/order.service.ts',
      code: "class Orders extends Context.Service<Orders, { readonly schedule: { readonly cancel: (params: OrderScheduleCancelParams) => void } }>()('key') {}",
    },
    {
      name: 'a method signature',
      filename: 'src/order/order.service.ts',
      code: "class Orders extends Context.Service<Orders, { create(params: OrderCreateParams): void }>()('key') {}",
    },
    {
      name: 'a method without parameters',
      filename: 'src/order/order.service.ts',
      code: "class Orders extends Context.Service<Orders, { readonly list: () => void }>()('key') {}",
    },
    {
      name: 'a member that is not a function',
      filename: 'src/order/order.service.ts',
      code: "class Orders extends Context.Service<Orders, { readonly channels: Kit.Channels<Input> }>()('key') {}",
    },
    {
      name: 'another declaration is skipped',
      filename: 'src/order/order.service.ts',
      code: 'const x = make<Orders, { readonly get: (params: OrderGetInput) => void }>()',
    },
    {
      name: 'an allowed type',
      filename: 'src/order/order.service.ts',
      code: "class Orders extends Context.Service<Orders, { readonly credit: (params: WalletKit.WriteInput) => void }>()('key') {}",
      options: { allow: '^WalletKit\\.' },
    },
    {
      name: 'a name after the method path',
      filename: 'src/order/order.service.ts',
      code: "class Orders extends Context.Service<Orders, { readonly schedule: { readonly cancel: (params: OrderScheduleCancelParams) => void } }>()('key') {}",
      options: { name: '^{Folder}{Path}Params$' },
    },
    {
      name: 'one of several names',
      filename: 'src/order/order.service.ts',
      code: "class Orders extends Context.Service<Orders, { readonly list: (params: SearchParams) => void }>()('key') {}",
      options: { name: ['^{Folder}\\w*Params$', '^SearchParams$'] },
    },
    {
      name: 'another declaration',
      filename: 'src/order/order.service.ts',
      code: "class Orders extends Service.Tag<Orders, { readonly get: (params: OrderGetParams) => void }>()('k') {}",
      options: { declaration: 'Service.Tag' },
    },
    {
      name: 'a wire Schema',
      filename: 'src/order/order.service.ts',
      code: "class Orders extends Context.Service<Orders, { readonly get: (params: OrderSchemas.OrderGetInput) => void }>()('key') {}",
      errors: ["'get' takes 'OrderSchemas.OrderGetInput'; a service method takes a params type that matches ^Order\\w*Params$."],
    },
    {
      name: 'a params type of another domain',
      filename: 'src/order/order.service.ts',
      code: "class Orders extends Context.Service<Orders, { readonly get: (params: UserGetParams) => void }>()('key') {}",
      errors: ['name'],
    },
    {
      name: 'a nested wire Schema',
      filename: 'src/order/order.service.ts',
      code: "class Orders extends Context.Service<Orders, { readonly schedule: { readonly cancel: (params: OrderCancelInput) => void } }>()('key') {}",
      errors: ["'schedule.cancel' takes 'OrderCancelInput'; a service method takes a params type that matches ^Order\\w*Params$."],
    },
    {
      name: 'an inline type',
      filename: 'src/order/order.service.ts',
      code: "class Orders extends Context.Service<Orders, { readonly get: (params: { id: string }) => void }>()('key') {}",
      errors: ['inline'],
    },
    {
      name: 'a primitive',
      filename: 'src/order/order.service.ts',
      code: "class Orders extends Context.Service<Orders, { get(id: string): void }>()('key') {}",
      errors: ['inline'],
    },
    {
      name: 'a name off the method path',
      filename: 'src/order/order.service.ts',
      code: "class Orders extends Context.Service<Orders, { readonly get: (params: OrderFindParams) => void }>()('key') {}",
      options: { name: '^{Folder}{Path}Params$' },
      errors: ['name'],
    },
    {
      name: 'a type outside the allowed ones',
      filename: 'src/order/order.service.ts',
      code: "class Orders extends Context.Service<Orders, { readonly get: (params: OrderKit.GetInput) => void }>()('key') {}",
      options: { allow: '^WalletKit\\.' },
      errors: ['name'],
    },
    {
      name: 'a path template capture and a message',
      filename: 'packages/contract/src/orders/orders.service.ts',
      code: "class Orders extends Context.Service<Orders, { readonly create: (params: CreateParams) => void }>()('key') {}",
      options: { stem: 'folder', singularize: 'trailing-s', name: '^{Domain}\\w*Params$', message: 'Name it after the domain.' },
      errors: ["'create' takes 'CreateParams'; a service method takes a params type that matches ^Order\\w*Params$. Name it after the domain."],
    },
    {
      name: 'an effect member passes without values',
      filename: 'src/order/order.service.ts',
      code: "class Orders extends Context.Service<Orders, { readonly current: Effect.Effect<Order> }>()('key') {}",
    },
    {
      name: 'a no-input read as a function passes values',
      filename: 'src/order/order.service.ts',
      code: "class Orders extends Context.Service<Orders, { readonly current: () => Effect.Effect<Order>; readonly channels: Kit.Channels<Input> }>()('key') {}",
      options: { values: '^Effect\\.Effect$' },
    },
    {
      name: 'two parameters pass without params',
      filename: 'src/order/order.service.ts',
      code: "class Orders extends Context.Service<Orders, { readonly move: (params: OrderMoveParams, to: OrderMoveParams) => void }>()('key') {}",
    },
    {
      name: 'one parameter passes params 1',
      filename: 'src/order/order.service.ts',
      code: "class Orders extends Context.Service<Orders, { readonly move: (params: OrderMoveParams) => void; readonly list: () => void }>()('key') {}",
      options: { params: 1 },
    },
    {
      name: 'an effect member with values',
      filename: 'src/order/order.service.ts',
      code: "class Orders extends Context.Service<Orders, { readonly current: Effect.Effect<Order> }>()('key') {}",
      options: { values: '^Effect\\.Effect$' },
      errors: ['value'],
    },
    {
      name: 'an effect member in a group',
      filename: 'src/order/order.service.ts',
      code: "class Orders extends Context.Service<Orders, { readonly schedule: { readonly current: Effect.Effect<Order> } }>()('key') {}",
      options: { values: '^Effect\\.Effect$', message: 'Read {Path} on each call.' },
      errors: ["'schedule.current' is typed 'Effect.Effect'; a service member is a function, so a read without input takes no parameters. Read ScheduleCurrent on each call."],
    },
    {
      name: 'two parameters with params 1',
      filename: 'src/order/order.service.ts',
      code: "class Orders extends Context.Service<Orders, { readonly move: (params: OrderMoveParams, to: OrderMoveParams) => void }>()('key') {}",
      options: { params: 1 },
      errors: ['params'],
    },
    {
      name: 'a method signature with two parameters',
      filename: 'src/order/order.service.ts',
      code: "class Orders extends Context.Service<Orders, { move(params: OrderMoveParams, to: string): void }>()('key') {}",
      options: { params: 1 },
      errors: ["'move' takes 2 parameters; a service method takes at most 1."],
    },
  ])('$name', (row) => testerRun(effectServiceParams, row))
})
