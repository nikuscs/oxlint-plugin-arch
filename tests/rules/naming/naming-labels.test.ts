import { describe, it } from 'vitest'
import { namingLabels } from '../../../src/rules/naming/naming-labels.ts'
import { testerRun } from '../../utils/tester.utils.ts'

describe('arch/naming-labels', () => {
  it.each([
    { name: 'a label from the path template', filename: 'packages/kit-wallet/src/wallet-entry.layer.ts', code: "const run = Effect.fn('wallet.entryList')(function* () {})", options: { file: 'kit-{module}/src/**', labels: [{ callee: 'Effect.fn', pattern: '^{module}[.]' }] } },
    { name: 'a file off the path template is skipped', filename: 'apps/web/src/a.ts', code: "const run = Effect.fn('other.run')(function* () {})", options: { file: 'kit-{module}/src/**', labels: [{ callee: 'Effect.fn', pattern: '^{module}[.]' }] } },
    { name: 'a label off the path template', filename: 'packages/kit-wallet/src/wallet-entry.layer.ts', code: "const run = Effect.fn('entry.list')(function* () {})", options: { file: 'kit-{module}/src/**', labels: [{ callee: 'Effect.fn', pattern: '^{module}[.]' }] }, errors: ["'entry.list' must match ^wallet[.]."] },
    { name: 'no options checks nothing', code: "const a = Effect.fn('b')(function* () {})" },
    { name: 'an unlisted callee passes', code: "const a = Other.fn('b')()", options: { labels: [{ callee: 'Effect.fn', name: '{name}' }] } },
    { name: 'a label equal to the name', code: "const send = Effect.fn('send')(function* () {})", options: { labels: [{ callee: 'Effect.fn', name: '{name}' }] } },
    {
      name: 'a loose label ignores dots and case',
      code: "export const orderActionScheduleCancel = Effect.fn('order.schedule.cancel')(function* () {})",
      options: { labels: [{ callee: 'Effect.fn', name: '{name}', drop: ['Action', 'Query'], loose: true }] },
    },
    {
      name: 'a label is read through later calls and pipes',
      code: "const verify = Effect.fn('verify')(function* () {}, Effect.orDie).pipe(Effect.withSpan('x'))",
      options: { labels: [{ callee: 'Effect.fn', name: '{name}' }] },
    },
    {
      name: 'a suffix is dropped from the name',
      code: "const OrderRefundWorkflow = Workflow.make('OrderRefund', {})",
      options: { labels: [{ callee: 'Workflow.make', name: '{name}', drop: 'Workflow$' }] },
    },
    {
      name: 'a class label reads the path',
      filename: 'src/order/order.service.ts',
      code: "class Orders extends Context.Service<Orders, {}>()('@app/contract/order/order.service/Orders') {}",
      options: { labels: [{ callee: 'Context.Service', name: '@app/contract/{folder}/{file}/{name}' }] },
    },
    {
      name: 'a dashed folder stays as written',
      filename: 'src/supplier-order/supplier-order.service.ts',
      code: "class SupplierOrders extends Context.Service<SupplierOrders, {}>()('@app/contract/supplier-order/supplier-order.service/SupplierOrders') {}",
      options: { labels: [{ callee: 'Context.Service', name: '@app/contract/{folder}/{file}/{name}' }] },
    },
    {
      name: 'a label in an object property',
      code: "class OrderNotFound extends Kit.Tagged<OrderNotFound>()({ tag: 'OrderNotFound', code: 'NOT_FOUND' }) {}",
      options: { labels: [{ callee: '*.Tagged', property: 'tag', name: '{name}' }, { callee: '*.Tagged', property: 'code', pattern: '^[A-Z][A-Z0-9_]*$' }] },
    },
    { name: 'several names are allowed', code: "const send = Effect.fn('mail.send')()", options: { labels: [{ callee: 'Effect.fn', name: ['{name}', 'mail.{name}'] }] } },
    { name: 'a label passed as an argument has no name', code: "const layer = Flow.toLayer(Effect.fn('other')(function* () {}))", options: { labels: [{ callee: 'Effect.fn', name: '{name}' }] } },
    { name: 'a dynamic label is skipped', code: 'const send = Effect.fn(label)()', options: { labels: [{ callee: 'Effect.fn', name: '{name}' }] } },
    { name: 'a pattern reads the folder', filename: 'order/order.actions.ts', code: "const a = Effect.fn('order.create')()", options: { labels: [{ callee: 'Effect.fn', pattern: '^{folder}\\.' }] } },
    { name: 'a label off the name', code: "const send = Effect.fn('deliver')(function* () {})", options: { labels: [{ callee: 'Effect.fn', name: '{name}' }] }, errors: ['name'] },
    {
      name: 'a span off the function path',
      code: "export const orderActionScheduleCancel = Effect.fn('order.cancel')(function* () {})",
      options: { labels: [{ callee: 'Effect.fn', name: '{name}', drop: ['Action', 'Query'], loose: true }] },
      errors: ["'order.cancel' must be 'orderScheduleCancel', after the name 'orderActionScheduleCancel'."],
    },
    { name: 'case matters without loose', code: "const send = Effect.fn('Send')()", options: { labels: [{ callee: 'Effect.fn', name: '{name}' }] }, errors: ['name'] },
    {
      name: 'a workflow name off its constant',
      code: "const OrderRefundWorkflow = Workflow.make('Refund', {})",
      options: { labels: [{ callee: 'Workflow.make', name: '{name}', drop: 'Workflow$' }] },
      errors: ['name'],
    },
    {
      name: 'a class label off the path',
      filename: 'src/order/order.service.ts',
      code: "class Orders extends Context.Service<Orders, {}>()('@app/contract/orders/Orders') {}",
      options: { labels: [{ callee: 'Context.Service', name: '@app/contract/{folder}/{file}/{name}' }] },
      errors: ["'@app/contract/orders/Orders' must be '@app/contract/order/order.service/Orders', after the name 'Orders'."],
    },
    {
      name: 'a tag off its class',
      code: "class OrderNotFound extends Kit.Tagged<OrderNotFound>()({ tag: 'NotFound', code: 'NOT_FOUND' }) {}",
      options: { labels: [{ callee: '*.Tagged', property: 'tag', name: '{name}' }] },
      errors: ['name'],
    },
    {
      name: 'a code off its pattern',
      code: "class OrderNotFound extends Kit.Tagged<OrderNotFound>()({ tag: 'OrderNotFound', code: 'notFound' }) {}",
      options: { labels: [{ callee: '*.Tagged', property: 'code', pattern: '^[A-Z][A-Z0-9_]*$' }] },
      errors: ['pattern'],
    },
    { name: 'a pattern is checked without a name', code: "run(Effect.fn('Bad Name')())", options: { labels: [{ callee: 'Effect.fn', pattern: '^[a-z.]+$' }] }, errors: ['pattern'] },
    { name: 'a label off the folder pattern', filename: 'order/order.actions.ts', code: "const a = Effect.fn('user.create')()", options: { labels: [{ callee: 'Effect.fn', pattern: '^{folder}\\.' }] }, errors: ['pattern'] },
    {
      name: 'a label inside a call takes the receiver name',
      code: "const UserBanLayer = UserBanWorkflow.toLayer(Effect.fn('user.banWorkflow')(function* () {}))",
      options: { labels: [{ callee: 'Effect.fn', name: '{name}', within: '*.toLayer', loose: true }] },
    },
    {
      name: 'a label inside a call off the receiver name',
      code: "const Layer = UserVerifyEmailWorkflow.toLayer(Effect.fn('user.emailVerifyWorkflow')(function* () {}))",
      options: { labels: [{ callee: 'Effect.fn', name: '{name}', within: '*.toLayer', loose: true }] },
      errors: ["'user.emailVerifyWorkflow' must be 'UserVerifyEmailWorkflow', after the name 'UserVerifyEmailWorkflow'."],
    },
    { name: 'an entry message', code: "const a = Effect.fn('b')(function* () {})", options: { labels: [{ callee: 'Effect.fn', pattern: '^a', message: 'Spans start with a.' }] }, errors: ["'b' must match ^a. Spans start with a."] },
    { name: 'a rule message', code: "const a = Effect.fn('b')(function* () {})", options: { message: 'See the guide.', labels: [{ callee: 'Effect.fn', name: '{name}' }] }, errors: ["'b' must be 'a', after the name 'a'. See the guide."] },
    { name: 'a domain from the folder', filename: 'src/orders/orders.layer.ts', code: "const a = Effect.fn('order.a')(function* () {})", options: { stem: 'folder', singularize: 'trailing-s', labels: [{ callee: 'Effect.fn', pattern: '^{domain}[.]' }] } },
    { name: 'an unbound label passes without always', filename: 'test/order/order.delivery.test.ts', code: "layer(AppLayer)('order', (it) => {})", options: { stem: 'full-basename', roles: ['test'], separators: ['.'], labels: [{ callee: 'layer', name: '{stem}' }] } },
    { name: 'an unbound label equal to the file stem', filename: 'test/order/order.delivery.test.ts', code: "layer(TestLayer.AppLayer)('order.delivery', (it) => { it.effect('works', () => run) })", options: { stem: 'full-basename', roles: ['test'], separators: ['.'], labels: [{ callee: 'layer', name: '{stem}', always: true }] } },
    {
      name: 'an unbound label off the file stem',
      filename: 'test/order/order.delivery.test.ts',
      code: "layer(TestLayer.AppLayer)('order.delivery with a clock', (it) => {})",
      options: { stem: 'full-basename', roles: ['test'], separators: ['.'], labels: [{ callee: 'layer', name: '{stem}', always: true }] },
      errors: ["'order.delivery with a clock' must be 'order.delivery'."],
    },
    { name: 'an unbound label skips a template that needs the name', code: "register(Effect.fn('anything')(function* () {}))", options: { labels: [{ callee: 'Effect.fn', name: '{name}', always: true }] } },
    { name: 'a bound label with always still follows its name', code: "const a = Effect.fn('b')(function* () {})", options: { labels: [{ callee: 'Effect.fn', name: '{name}', always: true }] }, errors: ['name'] },
  ])('$name', (row) => testerRun(namingLabels, row))
})
