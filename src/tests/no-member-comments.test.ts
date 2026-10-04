import { test } from 'vitest'
import { noMemberComments } from '../rules/no-member-comments.ts'
import { createRuleTester } from './rule-tester.ts'

const error = { messageId: 'memberComment' }

test('no-member-comments', () => {
  createRuleTester().run('arch/no-member-comments', noMemberComments, {
    valid: [
      'interface Props {\n // eslint-disable-next-line no-explicit-any\n title: any\n}',
      'interface Props {\n // oxlint-disable-next-line no-explicit-any\n title: any\n}',
      'interface Props {\n // @ts-expect-error upstream types are wrong\n title: string\n}',
      'interface Props {\n // @ts-check\n title: string\n}',
      'interface Props {\n /// <reference types="node" />\n title: string\n}',
      'interface Props {\n /// <amd-module name="props" />\n title: string\n}',
      'interface Props {\n /* #__PURE__ */\n title: string\n}',
      'interface Props {\n /* @__PURE__ */\n title: string\n}',
      'interface Props {\n /* @__NO_SIDE_EFFECTS__ */\n title: string\n}',
      'interface Props {\n /*#__NO_SIDE_EFFECTS__*/\n title: string\n}',
      'interface Props {\n /** @jsx h */\n title: string\n}',
      'interface Props {\n /** @jsxImportSource preact */\n title: string\n}',
      'interface Props {\n /** @jsxRuntime automatic */\n title: string\n}',
      'interface Props {\n /** @jsxFrag Fragment */\n title: string\n}',
      'interface Props {\n /* @vite-ignore */\n title: string\n}',
      'interface Props {\n //# sourceMappingURL=props.js.map\n title: string\n}',
      'interface Props {\n /*! Copyright 2026 */\n title: string\n}',
      'const o = {\n // prettier-ignore\n k: 1,\n}',
      'const o = {\n // Why: order matters here.\n ...rest,\n}',
      'const [a] = [\n // Array hole, not a member.\n 1,\n]',
      'const props = {\n // Why: upstream rejects null.\n title: "Hello"\n}',
      'interface Props { title: string }',
      '/** Public contract. */\ninterface Props { title: string }',
      '// Function documentation.\nfunction render() {\n // Local explanation.\n return 1\n}',
      'class Props {\n // Class field.\n title = "Hello"\n}',
      'interface Props {\n // Why: the library requires a stable key.\n title: string\n}',
      'interface Props {\n /**\n  * Why: the library requires a stable key.\n  */\n title: string\n}',
      'interface Props {\n /* Why: the library requires a stable key. */\n title: string\n}',
      'interface Props {\n // Why: the library requires a stable key\n // across renders to preserve focus.\n title: string\n}',
      'interface Props { title: string; // Why: upstream rejects null.\n}',
      'interface Props { title: string\n // Detached closing comment.\n}',
    ],
    invalid: [
      {
        code: 'const o = {\n // Spread it.\n ...rest,\n k: 1,\n}',
        output: 'const o = {\n ...rest,\n k: 1,\n}',
        errors: [error],
      },
      ...['// The title.', '/** The title. */', '/* The title. */'].map((comment) => ({
        code: `const props = {\n ${comment}\n title: 'Hello'\n}`,
        output: "const props = {\n title: 'Hello'\n}",
        errors: [error],
      })),
      {
        code: 'interface Props {\n // Method documentation.\n render(): void\n}',
        output: 'interface Props {\n render(): void\n}',
        errors: [error],
      },
      {
        code: 'interface Props { render(): void; // Method comment.\n title: string }',
        output: 'interface Props { render(): void;\n title: string }',
        errors: [error],
      },
      ...['// The title.', '/** The title. */', '/* The title. */'].map((comment) => ({
        code: `interface Props {\n  ${comment}\n\n  title: string\n}`,
        output: 'interface Props {\n  title: string\n}',
        errors: [error],
      })),
      {
        code: 'interface Props {\n // Why: upstream rejects null.\n title: string\n}',
        options: [{ allowWhy: false }],
        output: 'interface Props {\n title: string\n}',
        errors: [error],
      },
      ...['/* Why: upstream rejects null. */', '/**\n  * Why: upstream rejects null.\n  */'].map((comment) => ({
        code: `interface Props {\n ${comment}\n title: string\n}`,
        options: [{ allowWhy: false }],
        output: 'interface Props {\n title: string\n}',
        errors: [error],
      })),
      {
        code: 'interface Props { title: string; // The title.\n\n count: number\n}',
        output: 'interface Props { title: string;\n count: number\n}',
        errors: [error],
      },
      {
        code: 'function render(props: {\n /** The title. */\n title: string\n}) {}',
        output: 'function render(props: {\n title: string\n}) {}',
        errors: [error],
      },
      {
        code: 'type Props = { /* The title. */ title: string }',
        output: 'type Props = { title: string }',
        errors: [error],
      },
      {
        code: 'interface Props {\r\n  /** The title. */\r\n  \r\n  title: string\r\n}',
        output: 'interface Props {\r\n  title: string\r\n}',
        errors: [error],
      },
      {
        code: 'interface Props {\n /* The title. */ title: string\n}',
        output: 'interface Props {\n title: string\n}',
        errors: [error],
      },
      {
        code: 'interface Props { title: string; // The title.\n count: number\n}',
        output: 'interface Props { title: string;\n count: number\n}',
        errors: [error],
      },
      {
        code: 'type Props = {\n // Outer.\n nested: {\n // Inner.\n value: string\n }\n}',
        output: 'type Props = {\n nested: {\n value: string\n }\n}',
        errors: [error, error],
      },
      {
        code: 'interface Props {\n // First line.\n // Second line.\n title: string\n}',
        output: 'interface Props {\n title: string\n}',
        errors: [error],
      },
      {
        code: 'interface Props {\n // why: lowercase is not the escape.\n title: string\n}',
        output: 'interface Props {\n title: string\n}',
        errors: [error],
      },
      {
        code: 'interface Props {\n // ! important\n title: string\n}',
        output: 'interface Props {\n title: string\n}',
        errors: [error],
      },
      {
        code: 'interface Props {\n /* ! not a legal block */\n title: string\n}',
        output: 'interface Props {\n title: string\n}',
        errors: [error],
      },
    ],
  })
})

test('no-member-comments in TSX', () => {
  createRuleTester('tsx').run('arch/no-member-comments', noMemberComments, {
    valid: [],
    invalid: [
      {
        filename: '/repo/component.tsx',
        code: 'function View(props: {\n // The title.\n title: string\n}) { return <h1>{props.title}</h1> }',
        output: 'function View(props: {\n title: string\n}) { return <h1>{props.title}</h1> }',
        errors: [error],
      },
    ],
  })
})
