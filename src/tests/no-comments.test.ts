import { test } from 'vitest'
import { noComments } from '../rules/no-comments.ts'
import { createRuleTester } from './rule-tester.ts'

const error = { messageId: 'comment' }

test('no-comments', () => {
  createRuleTester().run('arch/no-comments', noComments, {
    valid: [
      'const value = 1',
      '// eslint-disable-next-line no-explicit-any\nconst value: any = 1',
      '// oxlint-disable-next-line no-explicit-any\nconst value: any = 1',
      '// @ts-expect-error upstream types are wrong\nconst value = 1',
      '// @ts-ignore legacy\nconst value = 1',
      '// @ts-nocheck\nconst value = 1',
      '// @ts-check\nconst value = 1',
      '/// <reference types="node" />\nconst value = 1',
      '/// <amd-module name="value" />\nconst value = 1',
      'const value = /*#__PURE__*/ factory()',
      'const value = /* @__PURE__ */ factory()',
      '/* @__NO_SIDE_EFFECTS__ */ function factory() {}',
      '/*#__NO_SIDE_EFFECTS__*/ function factory() {}',
      '/** @jsx h */\nconst value = 1',
      '/** @jsxImportSource preact */\nconst value = 1',
      '/** @jsxRuntime automatic */\nconst value = 1',
      '/** @jsxFrag Fragment */\nconst value = 1',
      'import(/* @vite-ignore */ path)',
      '//# sourceMappingURL=value.js.map',
      '/*! Copyright 2026 */\nconst value = 1',
      '// prettier-ignore\nconst value = 1',
      '// biome-ignore lint: false positive\nconst value = 1',
      '// Why: cache keys must stay stable.\nconst value = 1',
      '/* Why: cache keys must stay stable. */\nconst value = 1',
      '/**\n * Why: cache keys must stay stable.\n */\nconst value = 1',
      '// Why: the library requires a stable key\n// across renders to preserve focus.\nconst value = 1',
      'const value = 1 // Why: trailing explanation.',
      {
        code: '/** Public contract. */\nexport const value = 1',
        options: [{ allowJsdoc: true }],
      },
      {
        code: '// Copyright 2026\nconst value = 1',
        options: [{ allowPatterns: ['^Copyright'] }],
      },
      {
        code: '/* TODO: keep this until the rewrite */\nconst value = 1',
        options: [{ allowPatterns: ['^TODO:'] }],
      },
      {
        code: '// eslint-disable-next-line foo\nconst value = 1',
        options: [{ allowWhy: false }],
      },
    ],
    invalid: [
      {
        code: '// leftover thought\nconst value = 1',
        output: 'const value = 1',
        errors: [error],
      },
      {
        code: 'const value = 1 // leftover thought',
        output: 'const value = 1',
        errors: [error],
      },
      {
        code: 'const value = 1 // leftover thought\nconst other = 2',
        output: 'const value = 1\nconst other = 2',
        errors: [error],
      },
      {
        code: 'const value = 1 // leftover thought\n\nconst other = 2',
        output: 'const value = 1\n\nconst other = 2',
        errors: [error],
      },
      {
        code: 'const value = 1 /* leftover */',
        output: 'const value = 1',
        errors: [error],
      },
      {
        code: 'const value = 1 /* a */ /* b */',
        output: 'const value = 1',
        errors: [error],
      },
      {
        code: 'export/* note */const value = 1',
        output: 'export const value = 1',
        errors: [error],
      },
      {
        code: 'const value = a +/* note */+ b',
        output: 'const value = a + + b',
        errors: [error],
      },
      {
        code: 'function f() { return/* note */value }',
        output: 'function f() { return value }',
        errors: [error],
      },
      {
        code: 'const value = 1/* note */.toString()',
        output: 'const value = 1 .toString()',
        errors: [error],
      },
      {
        code: 'function f() { return /* note\n */ 42 }',
        output: 'function f() { return \n 42 }',
        errors: [error],
      },
      {
        code: 'function f() { return /* note\u2028 */ 42 }',
        output: 'function f() { return \u2028 42 }',
        errors: [error],
      },
      {
        code: 'function f() { return /* note\u2029 */ 42 }',
        output: 'function f() { return \u2029 42 }',
        errors: [error],
      },
      {
        code: '// first line.\n// second line.\nconst value = 1',
        output: 'const value = 1',
        errors: [error],
      },
      {
        code: 'const value = 1\n// first line.\n// second line.\nconst other = 2',
        output: 'const value = 1\nconst other = 2',
        errors: [error],
      },
      {
        code: '/** Public contract. */\nexport const value = 1',
        output: 'export const value = 1',
        errors: [error],
      },
      {
        code: '/* Public contract. */\nexport const value = 1',
        output: 'export const value = 1',
        errors: [error],
      },
      {
        code: '// why: lowercase is not the escape.\nconst value = 1',
        output: 'const value = 1',
        errors: [error],
      },
      {
        code: '// Why: keep this.\nconst value = 1',
        options: [{ allowWhy: false }],
        output: 'const value = 1',
        errors: [error],
      },
      {
        code: '// leftover thought\n// Why: keep this.\nconst value = 1',
        output: '// Why: keep this.\nconst value = 1',
        errors: [error],
      },
      {
        code: '// Why: keep this.\nconst value = 1 // unrelated',
        output: '// Why: keep this.\nconst value = 1',
        errors: [error],
      },
      {
        code: '// eslint-disable-next-line foo\n// leftover thought\nconst value = 1',
        output: null,
        errors: [error],
      },
      {
        code: '/* oxlint-disable-next-line foo */\n// leftover thought\nconst value = 1',
        output: null,
        errors: [error],
      },
      {
        code: '/* oxlint-disable-next-line no-console */ /* note */\n// note\nconsole.log("x")',
        output: null,
        errors: [error],
      },
      {
        code: '/* oxlint-disable-next-line no-console */ /* note */\nconsole.log("x")',
        output: '/* oxlint-disable-next-line no-console */\nconsole.log("x")',
        errors: [error],
      },
      {
        code: '// leftover one\nconst value = 1\n// leftover two',
        output: 'const value = 1\n',
        errors: [error, error],
      },
      {
        code: 'function render() {\n // Local explanation.\n return 1\n}',
        output: 'function render() {\n return 1\n}',
        errors: [error],
      },
      {
        code: 'interface Props {\r\n  /** The title. */\r\n  \r\n  title: string\r\n}',
        output: 'interface Props {\r\n  title: string\r\n}',
        errors: [error],
      },
      {
        code: 'const value = 1; // leftover.\nconst other = 2',
        output: 'const value = 1;\nconst other = 2',
        errors: [error],
      },
      {
        code: '// ! important\nconst value = 1',
        output: 'const value = 1',
        errors: [error],
      },
      {
        code: '/* ! not a legal block */\nconst value = 1',
        output: 'const value = 1',
        errors: [error],
      },
    ],
  })
})

test('no-comments in TSX', () => {
  createRuleTester('tsx').run('arch/no-comments', noComments, {
    valid: [
      'function View() { return <div>Hello</div> }',
    ],
    invalid: [
      {
        filename: '/repo/component.tsx',
        code: 'function View() { return <div>{/* hide */}</div> }',
        output: null,
        errors: [error],
      },
      {
        filename: '/repo/component.tsx',
        code: 'function View() { return <>{/* hide */}</> }',
        output: null,
        errors: [error],
      },
      {
        filename: '/repo/component.tsx',
        code: 'function View() { return <div>{ /* hide */ }</div> }',
        output: null,
        errors: [error],
      },
      {
        filename: '/repo/component.tsx',
        code: 'function View() {\n return (\n <div>\n {/* hide */}\n <span />\n </div>\n )\n}',
        output: null,
        errors: [error],
      },
      {
        filename: '/repo/component.tsx',
        code: 'const view = <p>Hello\n{/* note */}\nworld</p>',
        output: null,
        errors: [error],
      },
      {
        filename: '/repo/component.tsx',
        code: 'function View() { return <div>{/* note */ 1}</div> }',
        output: 'function View() { return <div>{ 1}</div> }',
        errors: [error],
      },
      {
        filename: '/repo/component.tsx',
        code: 'function View() { return <p>Hello {/* note */}world</p> }',
        output: null,
        errors: [error],
      },
    ],
  })
})
