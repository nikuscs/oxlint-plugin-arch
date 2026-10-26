import { describe, it } from 'vitest'
import { filesHelpers } from '../../../src/rules/files/files-helpers.ts'
import { testerRun } from '../../utils/tester.utils.ts'

describe('arch/files-helpers', () => {
  it.each([
    { name: 'a component passes', code: 'export function UserCard() { return <div /> }' },
    { name: 'a const component passes', code: 'export const UserCard = () => <div />' },
    { name: 'a hook passes', code: 'export function useUserCard() { return null }' },
    { name: 'a nested helper passes', code: 'export function UserCard() { function format() {} return <div /> }' },
    { name: 'a non-function const passes', code: 'const limit = 10' },
    { name: 'an allowed local name passes', code: 'function formatName() {}', options: { allow: '^format[A-Z]' } },
    { name: 'an allow list passes', code: 'function makeCard() {}', options: { allow: ['^build[A-Z]', '^make[A-Z]'] } },
    { name: 'an allowed exported name passes', code: 'function local() {}\nexport { local as formatName }', options: { allow: '^format[A-Z]' } },
    { name: 'a custom hook pattern passes', code: 'function withCard() {}', options: { hooks: '^with[A-Z]' } },
    { name: 'a form component passes', code: 'export function ContentForm() { return <form /> }' },
    { name: 'a form hook passes', code: 'export function useContentForm() { return null }' },
    { name: 'an allowed exported form factory passes', code: 'export function makeContentForm() { return null }', options: { allow: '^make[A-Z]' } },
    {
      name: 'a form factory matching an allow list passes',
      code: 'export function makeContentForm() { return null }',
      options: { allow: ['^build[A-Z]', '^make[A-Z]'] },
    },
    {
      name: 'a form wrapper matching a hook pattern list passes',
      code: 'export function withContentForm() { return null }',
      options: { hooks: ['^use[A-Z]', '^with[A-Z]'] },
    },
    { name: 'a submit handler nested inside a form passes', code: 'export function ContentForm() { function handleSubmit() {} return <form /> }' },
    { name: 'a top-level function', code: 'function formatName() {}\nexport function UserCard() { return <div /> }', errors: ['helper'] },
    { name: 'a const arrow function', code: 'const buildPayload = () => ({})', errors: ['helper'] },
    { name: 'an exported helper', code: 'export function formatName() {}', errors: ['helper'] },
    { name: 'a component when components are off', code: 'export function UserCard() { return <div /> }', options: { components: false }, errors: ['helper'] },
    { name: 'a hook outside a custom hook pattern', code: 'function useCard() {}', options: { hooks: '^with[A-Z]' }, errors: ['helper'] },
    { name: 'a custom message', code: 'function format() {}', options: { message: 'Nest this in its route handler.' }, errors: ['helper'] },
    { name: 'one report per helper', code: 'function a() {}\nconst b = () => 1', errors: ['helper', 'helper'] },
    {
      name: 'a search helper beside a form component',
      code: 'function handlePersonaSearch() {}\nexport function ContentForm() { return <form /> }',
      errors: ['helper'],
    },
    {
      name: 'a payload arrow beside a form component',
      code: 'const buildPayload = () => ({})\nexport function ContentForm() { return <form /> }',
      errors: ['helper'],
    },
  ])('$name', (row) => testerRun(filesHelpers, row))
})
