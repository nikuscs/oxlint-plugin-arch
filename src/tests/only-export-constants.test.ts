import { test } from 'vitest'
import { onlyExportConstants } from '../rules/only-export-constants.ts'
import { createRuleTester } from './rule-tester.ts'

const error = { messageId: 'nonConstant' }

test('only-export-constants', () => {
  createRuleTester().run('arch/only-export-constants', onlyExportConstants, {
    valid: [
      'export const limit = 10',
      'export const limit = 10, settings = { enabled: true }',
      'const limit = 10; export { limit as max, limit as "max-limit" }',
      'export { limit }; const limit = 10',
      'export const limit = 10; export { limit as max }; export default limit',
      'const limit = 10; export default limit',
      'const limit = 10; export { limit as default }',
      'export const { limit, nested: { enabled }, ...rest } = settings',
      'const [first, , ...rest] = values; export { first, rest }',
      'const { limit = 10, renamed: local } = settings; export { limit, local }',
      'export const settings = loadSettings()',
      'export const [first = 1, ...rest] = values',
      'export const settings = { run() {} }',
      'function localHelper() {}; const privateCallback = () => {}; export const limit = 10',
      'let current = 1; export const snapshot = current',
      'import { limit } from "settings"; export const copy = limit',
      'declare const limit: number; export { limit }',
      {
        code: 'export const run = () => {}; export const save = function () {}',
        options: [{ allowFunctionValues: true }],
      },
      {
        code: 'function run() {}; const alias = run; export const execute = alias',
        options: [{ allowFunctionValues: true }],
      },
      {
        code: 'export interface Settings {}; export type Mode = "fast"',
        options: [{ allowTypeExports: true }],
      },
      {
        code: 'interface Settings {}; type Mode = "fast"; export { Settings, Mode }',
        options: [{ allowTypeExports: true }],
      },
      {
        code: 'export default interface Settings {}',
        options: [{ allowTypeExports: true }],
      },
      {
        code: 'import type { Settings } from "settings"; export { Settings }',
        options: [{ allowTypeExports: true }],
      },
      {
        code: 'import { type Settings } from "settings"; export type { Settings }',
        options: [{ allowTypeExports: true }],
      },
      {
        code: 'export type { Settings } from "settings"; export type * from "types"',
        options: [{ allowTypeExports: true }],
      },
      {
        code: 'export { limit } from "settings"; export * from "more"; export * as settings from "settings"',
        options: [{ allowReExports: true }],
      },
      {
        code: 'import { limit } from "settings"; import other from "other"; import * as all from "all"; export { limit, all }; export default other',
        options: [{ allowReExports: true }],
      },
      {
        code: 'export import settings = require("settings")',
        options: [{ allowReExports: true }],
      },
    ],
    invalid: [
      { code: 'export let limit = 10; export var count = 1', errors: [error, error] },
      { code: 'let limit = 10; export { limit as max }', errors: [error] },
      { code: 'export function run() {}', errors: [error] },
      { code: 'export class Settings {}; export enum Mode { Fast }', errors: [error, error] },
      { code: 'export namespace Settings { export const limit = 10 }', errors: [error] },
      { code: 'export const run = () => {}; export const save = function () {}', errors: [error, error] },
      { code: 'const run = () => {}; export { run as execute }', errors: [error] },
      { code: 'function run() {}; const alias = run; export const execute = alias', errors: [error] },
      { code: 'const run = () => {}; const alias = run; export default alias', errors: [error] },
      { code: 'export const run = (() => {}) as Callback', errors: [error] },
      { code: 'export const run = (() => {}) satisfies Callback', errors: [error] },
      { code: 'export const run = <Callback>(() => {})', errors: [error] },
      { code: 'export const run = (() => {})!', errors: [error] },
      { code: 'function identity<T>(value: T) { return value }; export const run = identity<string>', errors: [error] },
      { code: 'export const Settings = class {}', errors: [error] },
      { code: 'class Settings {}; export const alias = Settings', errors: [error] },
      { code: 'export interface Settings {}; export type Mode = "fast"', errors: [error, error] },
      { code: 'interface Settings {}; export { Settings }', errors: [error] },
      { code: 'export default interface Settings {}', errors: [error] },
      { code: 'export default 10', errors: [error] },
      { code: 'export default { limit: 10 }', errors: [error] },
      { code: 'export default function run() {}', errors: [error] },
      { code: 'export default () => {}', errors: [error] },
      { code: 'const limit = 10; export = limit', errors: [error] },
      { code: 'export as namespace Settings', errors: [error] },
      { code: 'export import settings = require("settings")', errors: [error] },
      { code: 'export * from "settings"; export * as settings from "settings"', errors: [error, error] },
      { code: 'export { limit } from "settings"', errors: [error] },
      { code: 'const limit = 10; export { limit } from "settings"', errors: [error] },
      { code: 'import { limit } from "settings"; export { limit }', errors: [error] },
      { code: 'import settings from "settings"; export default settings', errors: [error] },
      { code: 'export type * from "settings"', errors: [error] },
      { code: 'import type { Settings } from "settings"; export { Settings }', errors: [error] },
      { code: 'export const first = second; const second = first', errors: [error] },
      {
        code: 'export function run() {}',
        options: [{ allowFunctionValues: true }],
        errors: [error],
      },
      {
        code: 'export const Settings = class {}',
        options: [{ allowFunctionValues: true }],
        errors: [error],
      },
      {
        code: 'export type { Settings } from "settings"',
        options: [{ allowReExports: true }],
        errors: [error],
      },
      {
        code: 'export { limit } from "settings"',
        options: [{ allowTypeExports: true }],
        errors: [error],
      },
      {
        code: 'export declare function run(): void',
        options: [{ allowTypeExports: true }],
        errors: [error],
      },
    ],
  })
})
