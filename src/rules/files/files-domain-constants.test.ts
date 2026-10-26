import { describe, it } from 'vitest'
import { testerRun } from '../../utils/tester.utils.ts'
import { filesDomainConstants } from './files-domain-constants.ts'

describe('arch/files-domain-constants', () => {
  it.each([
    { name: 'a camelCase constant passes', code: 'export const invoiceMaxLines = 50' },
    { name: 'literal data passes by default', code: "const labels = { yes: 'Yes' }" },
    { name: 'a nested constant passes', code: 'export function invoiceTotal() { const MAX_LINES = 50; return MAX_LINES }' },
    { name: 'a module let passes', code: 'let MAX_LINES = 50' },
    { name: 'computed values pass with data', code: 'export const invoiceService = invoiceCreate()', options: { data: true } },
    {
      name: 'runtime state owners pass with data',
      code: 'const cache = new WeakMap()\nconst pending = new Map()\nconst listeners = new Set()',
      options: { data: true },
    },
    {
      name: 'a service object passes with services',
      code: 'export const themeService = { themeApply(value) { return value.trim() } }',
      options: { data: true, services: true },
    },
    { name: 'a SCREAMING_CASE constant', code: 'const MAX_LINES = 50', errors: ['forbidden'] },
    { name: 'an exported SCREAMING_CASE constant', code: 'export const MAX_LINES = 50', errors: ['forbidden'] },
    { name: 'a SCREAMING_CASE call result', code: 'const CLIENT = clientCreate()', errors: ['forbidden'] },
    { name: 'a number with data', code: 'const limit = 3', options: { data: true }, errors: ['forbidden'] },
    { name: 'an object with data', code: 'export const labels = { yes: translate.yes }', options: { data: true }, errors: ['forbidden'] },
    { name: 'an as const array with data', code: 'const values = [1, 2] as const', options: { data: true }, errors: ['forbidden'] },
    { name: 'a satisfies object with data', code: 'const defaults = { limit: 3 } satisfies Options', options: { data: true }, errors: ['forbidden'] },
    { name: 'arithmetic with data', code: 'const delay = 3 * 1000', options: { data: true }, errors: ['forbidden'] },
    { name: 'a template with data', code: 'const label = `one item`', options: { data: true }, errors: ['forbidden'] },
    { name: 'a regex with data', code: 'const pattern = /chat/', options: { data: true }, errors: ['forbidden'] },
    { name: 'a seeded Map with data', code: "const labels = new Map([['yes', translate.yes]])", options: { data: true }, errors: ['forbidden'] },
    { name: 'a seeded Set with data', code: "const values = new Set(['yes'])", options: { data: true }, errors: ['forbidden'] },
    { name: 'a destructured binding with data', code: 'const { limit } = { limit: 3 }', options: { data: true }, errors: ['forbidden'] },
    {
      name: 'a service object without services',
      code: 'export const themeService = { themeApply(value) { return value.trim() } }',
      options: { data: true },
      errors: ['forbidden'],
    },
    {
      name: 'an unexported service object',
      code: 'const themeService = { themeApply(value) { return value.trim() } }',
      options: { data: true, services: true },
      errors: ['forbidden'],
    },
    {
      name: 'an arrow method in a service object',
      code: 'export const themeService = { themeApply: (value) => value.trim() }',
      options: { data: true, services: true },
      errors: ['forbidden'],
    },
    {
      name: 'a data key in a service object',
      code: 'export const themeService = { limit: 3, themeApply(value) { return value.trim() } }',
      options: { data: true, services: true },
      errors: ['forbidden'],
    },
    {
      name: 'a spread in a service object',
      code: 'export const themeService = { ...other, themeApply(value) { return value.trim() } }',
      options: { data: true, services: true },
      errors: ['forbidden'],
    },
    {
      name: 'a computed method in a service object',
      code: 'export const themeService = { [key](value) { return value.trim() } }',
      options: { data: true, services: true },
      errors: ['forbidden'],
    },
    {
      name: 'a getter in a service object',
      code: 'export const themeService = { get themeValue() { return value } }',
      options: { data: true, services: true },
      errors: ['forbidden'],
    },
    { name: 'one report per declarator', code: 'const A_ONE = 1, B_TWO = 2', errors: ['forbidden', 'forbidden'] },
  ])('$name', (row) => testerRun(filesDomainConstants, row))
})
