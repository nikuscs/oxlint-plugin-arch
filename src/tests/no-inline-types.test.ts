import { test } from 'vitest'
import { noInlineTypes } from '../rules/no-inline-types.ts'
import { createRuleTester } from './rule-tester.ts'

const error = { messageId: 'inlineType' }

test('no-inline-types', () => {
  createRuleTester().run('arch/no-inline-types', noInlineTypes, {
    valid: [
      'function save(input: SaveInput): SaveResult { return input }',
      'const save = (input: SaveInput): Promise<SaveResult> => run(input)',
      'function get(): string | undefined { return undefined }',
      'function get() { return { id: 1 } }',
      'type Input = { id: string }; interface Result { id: string }; type Callback = (input: { id: string }) => { ok: boolean }',
      'interface Service { save(input: { id: string }): { ok: boolean } }',
      'const data: { id: string } = { id: "one" }',
      {
        code: 'function save(input: { id: string }): Result { return input }',
        options: [{ parameters: false }],
      },
      {
        code: 'function save(input: Input): { id: string } { return input }',
        options: [{ returns: false }],
      },
      {
        code: 'function save(callback: (input: Input) => Result): () => Result { return callback }',
        options: [{ functionTypes: false }],
      },
      {
        code: 'function make(factory: new () => Service) {}',
        options: [{ functionTypes: false }],
      },
      {
        code: 'function save(input: { id: string }): { ok: boolean } { return { ok: true } }',
        options: [{ parameters: false, returns: false }],
      },
      {
        code: 'function save(input: {}): { ok: boolean } { return { ok: true } }',
        options: [{ minMembers: 2 }],
      },
      {
        code: 'function save(input: { id: string }): { ok: boolean } { return { ok: true } }',
        options: [{ minMembers: 2 }],
      },
      {
        code: 'function save(input: { nested: { id: string } }) {}',
        options: [{ minMembers: 2 }],
      },
      'function save(input: Input = make({ id: "one" })) {}',
    ],
    invalid: [
      { code: 'function save(input: {}) {}', errors: [error] },
      { code: 'function save(input: { id: string }) {}', errors: [error] },
      { code: 'function save({ id }: { id: string }) {}', errors: [error] },
      { code: 'const save = (input: { id: string }) => input', errors: [error] },
      { code: 'const save = function (input: { id: string }) { return input }', errors: [error] },
      { code: 'function save(input: { id: string } = { id: "one" }) {}', errors: [error] },
      { code: 'function save({ id }: { id: string } = { id: "one" }) {}', errors: [error] },
      { code: 'function save(...inputs: { id: string }[]) {}', errors: [error] },
      { code: 'function save([input]: [{ id: string }]) {}', errors: [error] },
      { code: 'class Service { constructor(private input: { id: string }) {} }', errors: [error] },
      {
        code: 'class Service { save(input: { id: string }): { ok: boolean } { return { ok: true } } }',
        errors: [error, error],
      },
      { code: 'const service = { save(input: { id: string }) {} }', errors: [error] },
      { code: 'declare function save(input: { id: string }): { ok: boolean }', errors: [error, error] },
      { code: 'abstract class Service { abstract save(input: { id: string }): void }', errors: [error] },
      { code: 'function save(input: Input): { ok: boolean } { return { ok: true } }', errors: [error] },
      { code: 'async function save(): Promise<{ ok: boolean }> { return { ok: true } }', errors: [error] },
      { code: 'function save(input: Readonly<{ id: string }>) {}', errors: [error] },
      { code: 'function save(input: Input & { extra: boolean }) {}', errors: [error] },
      { code: 'function save(input: { id: string } | { name: string }) {}', errors: [error, error] },
      { code: 'function save(input: { nested: { id: string }; run: () => void }) {}', errors: [error] },
      { code: 'function save(callback: (input: { id: string }) => { ok: boolean }) {}', errors: [error] },
      { code: 'function make(factory: new () => Service) {}', errors: [error] },
      { code: 'function save(): () => void { return () => {} }', errors: [error] },
      {
        code: 'function save(callback: (input: { id: string }) => void) {}',
        options: [{ functionTypes: false }],
        errors: [error],
      },
      {
        code: 'function save(input: { id: string }): { ok: boolean } { return { ok: true } }',
        options: [{ parameters: false }],
        errors: [error],
      },
      {
        code: 'function save(input: { id: string }): { ok: boolean } { return { ok: true } }',
        options: [{ returns: false }],
        errors: [error],
      },
      {
        code: 'function save(input: { id: string; name: string }) {}',
        options: [{ minMembers: 2 }],
        errors: [error],
      },
      {
        code: 'function save(input: { nested: { id: string; name: string } }) {}',
        options: [{ minMembers: 2 }],
        errors: [error],
      },
      {
        code: 'function save(callback: (input: Input) => Result) {}',
        options: [{ minMembers: 10 }],
        errors: [error],
      },
      { code: 'items.map((item: { id: string }) => item.id)', errors: [error] },
    ],
  })
})
