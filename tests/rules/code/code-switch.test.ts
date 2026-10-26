import { describe, it } from 'vitest'
import { codeSwitch } from '../../../src/rules/code/code-switch.ts'
import { testerRun } from '../../utils/tester.utils.ts'

describe('arch/code-switch', () => {
  it.each([
    { name: 'conditional passes', code: 'if (event.type === "created") onCreated(event)' },
    { name: 'pattern matching passes', code: 'match(event).with({ type: "created" }, onCreated).exhaustive()' },
    { name: 'switch-like text passes', code: 'const text = "switch (value) {}"' },
    { name: 'empty switch fails', code: 'switch (value) {}', errors: ['forbidden'] },
    { name: 'switch with cases fails', code: 'switch (event.type) { case "created": onCreated(event); break }', errors: ['forbidden'] },
    { name: 'nested switches each report', code: 'switch (first) { default: switch (second) {} }', errors: ['forbidden', 'forbidden'] },
    { name: 'custom message', code: 'switch (value) {}', options: { message: 'Use pattern matching.' }, errors: ['Use pattern matching.'] },
  ])('$name', (row) => testerRun(codeSwitch, row))
})
