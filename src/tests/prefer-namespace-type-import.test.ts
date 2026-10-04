import { test } from 'vitest'
import { preferNamespaceTypeImport } from '../rules/prefer-namespace-type-import.ts'
import { createRuleTester } from './rule-tester.ts'

const error = { messageId: 'namespace' }
const input = 'import type { A, B, C, D } from "./room.types";'
const output = 'import type * as RoomTypes from "./room.types";'

test('prefer-namespace-type-import', () => {
  createRuleTester().run('arch/prefer-namespace-type-import', preferNamespaceTypeImport, {
    valid: [
      'import type { A, B, C } from "x"',
      'import { type A, type B, type C } from "x"',
      'import { A, B, C, D } from "x"',
      'import { A, type B, type C, type D, type E } from "x"',
      'import Default, { type A, type B, type C, type D } from "x"',
      'import type * as X from "x"',
      'import type Default from "x"',
      'import "x"',
      { code: input, options: [{ max: 4 }] },
      { code: 'import type {} from "x"', options: [{ max: 0 }] },
      `${output}\nexport type Result = [RoomTypes.A, RoomTypes.B, RoomTypes.C, RoomTypes.D]`,
    ],
    invalid: [
      { code: input, output, errors: [error] },
      {
        code: `declare module "ambient" { ${input} export type T = A }`,
        output: `declare module "ambient" { ${output} export type T = RoomTypes.A }`,
        errors: [error],
      },
      {
        code: `// keep before\r\n${input} // keep after\r\ntype T = A`,
        output: `// keep before\r\n${output} // keep after\r\ntype T = RoomTypes.A`,
        errors: [error],
      },
      {
        code: 'import type { A, B, C, D } from "x" with { "resolution-mode": "import" }; type T = A',
        output: 'import type * as XTypes from "x" with { "resolution-mode": "import" }; type T = XTypes.A',
        errors: [error],
      },
      {
        code: `${input}\nexport type Result = [A, B, C, D]`,
        output: `${output}\nexport type Result = [RoomTypes.A, RoomTypes.B, RoomTypes.C, RoomTypes.D]`,
        errors: [error],
      },
      {
        code: 'import type { A, B } from "x"; type T = A | B',
        options: [{ max: 1, names: { x: 'Custom' } }],
        output: 'import type * as Custom from "x"; type T = Custom.A | Custom.B',
        errors: [error],
      },
      {
        code: 'import type { A } from "x"; type T = A',
        options: [{ max: 0 }],
        output: 'import type * as XTypes from "x"; type T = XTypes.A',
        errors: [error],
      },
      ...[
        ['#/types/room.types', 'RoomTypes'],
        ['./harness.types', 'HarnessTypes'],
        ['@orbs/server/client', 'ClientTypes'],
        ['./harness.types.ts', 'HarnessTypes'],
        ['./harness.d.ts', 'HarnessTypes'],
        ['./foo-bar.tsx', 'FooBarTypes'],
        ['./123.ts', 'Module123Types'],
      ].map(([source, name]) => ({
        code: `import type { A, B, C, D } from '${source}'\ntype T = A`,
        output: `import type * as ${name} from '${source}'\ntype T = ${name}.A`,
        errors: [error],
      })),
      {
        code: 'import { type A, type B, type C, type D } from "x"; type T = [A, B, C, D]',
        output: 'import type * as XTypes from "x"; type T = [XTypes.A, XTypes.B, XTypes.C, XTypes.D]',
        errors: [error],
      },
      {
        code: 'import { type A as Local, type B, type C, type D } from "x"; type T = Local<B>',
        output: 'import type * as XTypes from "x"; type T = XTypes.A<XTypes.B>',
        errors: [error],
      },
      {
        code: 'import type { A as Local, B, C, D } from "x"; type T = Local<B>',
        output: 'import type * as XTypes from "x"; type T = XTypes.A<XTypes.B>',
        errors: [error],
      },
      {
        code: `${input}\ntype T<U extends A = B> = [C<U>, ReturnType<typeof D>, A["id"], typeof D.member, A.Nested]`,
        output: `${output}\ntype T<U extends RoomTypes.A = RoomTypes.B> = [RoomTypes.C<U>, ReturnType<typeof RoomTypes.D>, RoomTypes.A["id"], typeof RoomTypes.D.member, RoomTypes.A.Nested]`,
        errors: [error],
      },
      {
        code: `${input}\ninterface T extends A, B.Inner<C> {}\nclass Impl implements D {}`,
        output: `${output}\ninterface T extends RoomTypes.A, RoomTypes.B.Inner<RoomTypes.C> {}\nclass Impl implements RoomTypes.D {}`,
        errors: [error],
      },
      {
        code: `${input}\ntype T<A> = [A, B]; function f(B: string): C { return {} as C }`,
        output: `${output}\ntype T<A> = [A, RoomTypes.B]; function f(B: string): RoomTypes.C { return {} as RoomTypes.C }`,
        errors: [error],
      },
      {
        code: `${input}\n// keep A\ntype T = { A: A; B: B }; type U = "C"`,
        output: `${output}\n// keep A\ntype T = { A: RoomTypes.A; B: RoomTypes.B }; type U = "C"`,
        errors: [error],
      },
      {
        code: `${input}\nexport type { A } from "other"; export type T = A`,
        output: `${output}\nexport type { A } from "other"; export type T = RoomTypes.A`,
        errors: [error],
      },
      {
        code: `${input}\nimport type { E, F, G, H } from "other";\ntype T = [A, E]`,
        output: `${output}\nimport type * as OtherTypes from "other";\ntype T = [RoomTypes.A, OtherTypes.E]`,
        errors: [error, error],
      },
      ...[
        'const RoomTypes = 1;',
        'type RoomTypes = string;',
        'function f<RoomTypes>(value: A): RoomTypes { throw 1 }',
        'function f() { const RoomTypes = 1; return null as A }',
        'type T = RoomTypes.Global;',
        'import type * as Existing from "./room.types";',
        'import * as Existing from "./room.types";',
        'export type { A };',
        'export type { A as Public };',
        'export { type A };',
        'export { A };',
        'const value = A;',
        'import Alias = A.Member;',
      ].map((suffix) => ({ code: `${input}\n${suffix}`, output: null, errors: [error] })),
      {
        code: 'import type { A, /* keep */ B, C, D } from "x"; type T = A',
        output: null,
        errors: [error],
      },
      {
        code: 'import type { A, B, C, D } /* keep */ from "x";',
        output: null,
        errors: [error],
      },
      {
        code: 'import type { "a-b" as A, B, C, D } from "x"; type T = A',
        output: null,
        errors: [error],
      },
      {
        code: 'import type { "A" as Local, B, C, D } from "x"; type T = Local',
        output: 'import type * as XTypes from "x"; type T = XTypes.A',
        errors: [error],
      },
      {
        code: input,
        options: [{ names: { './room.types': 'class' } }],
        output: null,
        errors: [error],
      },
      {
        code: `${input}\nimport type { E, F, G, H } from "other/room.types";`,
        output: null,
        errors: [error, error],
      },
      {
        code: `${input}\nimport type { E, F, G, H } from "./room.types";`,
        output: null,
        errors: [error, error],
      },
    ],
  })
})

test('prefer-namespace-type-import TSX', () => {
  createRuleTester('tsx').run('arch/prefer-namespace-type-import', preferNamespaceTypeImport, {
    valid: [`${output}\nconst view = <Widget<RoomTypes.A> value={null as RoomTypes.B} />`],
    invalid: [
      {
        code: `${input}\nconst view = <Widget<A> value={null as B} />`,
        output: `${output}\nconst view = <Widget<RoomTypes.A> value={null as RoomTypes.B} />`,
        errors: [error],
      },
    ],
  })
})

test('namespace diagnostics show the real TypeScript import syntax and source', () => {
  createRuleTester().run('arch/prefer-namespace-type-import', preferNamespaceTypeImport, {
    valid: [],
    invalid: [
      {
        code: input,
        output,
        errors: [
          {
            message:
              "Use \u0060import type * as RoomTypes from './room.types'\u0060 for 4 type imports (max 3); keep exported domain names.",
          },
        ],
      },
    ],
  })
})
