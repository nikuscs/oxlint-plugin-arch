#!/usr/bin/env bun
import { cpSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const skillRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const source = resolve(skillRoot, 'assets/arch')
const arguments_ = process.argv.slice(2)
const targetFlagIndex = arguments_.indexOf('--target')
const targetFlagValue = targetFlagIndex === -1 ? undefined : arguments_[targetFlagIndex + 1]

if (targetFlagIndex !== -1 && (!targetFlagValue || targetFlagValue.startsWith('--'))) {
  console.error('--target requires a destination path.')
  process.exit(2)
}

const positional = arguments_.find((argument, index) => (
  !argument.startsWith('--') && (targetFlagIndex === -1 || index !== targetFlagIndex + 1)
))

if (targetFlagValue && positional) {
  console.error('Choose either a positional destination or --target, not both.')
  process.exit(2)
}

const targetArgument = targetFlagValue ?? positional ?? 'tools/oxlint/arch'
const target = isAbsolute(targetArgument) ? resolve(targetArgument) : resolve(process.cwd(), targetArgument)
const force = arguments_.includes('--force')

if (existsSync(target) && !force) {
  console.error(`Refusing to overwrite ${target}. Re-run with --force only after reviewing the existing files.`)
  process.exit(1)
}

mkdirSync(dirname(target), { recursive: true })
cpSync(source, target, { recursive: true, force })

const relativeEntry = relative(process.cwd(), resolve(target, 'index.ts')).split(sep).join('/')
const specifier = relativeEntry.startsWith('.') || isAbsolute(relativeEntry) ? relativeEntry : `./${relativeEntry}`
console.log(`Copied oxlint-plugin-arch to ${target}`)
console.log(`Configure Oxlint with: { name: 'arch', specifier: '${specifier}' }`)
