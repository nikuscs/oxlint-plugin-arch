import { describe, it } from 'vitest'
import { testerRun } from '../../utils/tester.utils.ts'
import { namingFile } from './naming-file.ts'

describe('arch/naming-file', () => {
  it.each([
    {
      name: 'a matching name passes',
      filename: 'user-card.tsx',
      code: 'export {}',
      options: { pattern: '^[a-z0-9-]+\\.tsx?$', message: 'Use kebab-case file names.' },
    },
    {
      name: 'any pattern in a list passes',
      filename: 'billing.spec.ts',
      code: 'export {}',
      options: { pattern: ['\\.auth\\.spec\\.ts$', '^billing\\.spec\\.ts$'], message: 'Named specs only.' },
    },
    {
      name: 'flags apply to the pattern',
      filename: 'UserCard.tsx',
      code: 'export {}',
      options: { pattern: '^[a-z-]+\\.tsx$', message: 'Lowercase only.', flags: 'i' },
    },
    {
      name: 'a unique key passes',
      filename: 'migrations/002-posts.ts',
      files: { 'migrations/001-users.ts': '' },
      code: 'export {}',
      options: { pattern: '^\\d{3}-', message: 'Start with NNN-.', unique: '^(\\d{3})-' },
    },
    {
      name: 'a repeated key in another folder passes',
      filename: 'migrations/001-posts.ts',
      files: { 'seeds/001-users.ts': '' },
      code: 'export {}',
      options: { pattern: '^\\d{3}-', message: 'Start with NNN-.', unique: '^(\\d{3})-' },
    },
    {
      name: 'siblings the pattern rejects are skipped',
      filename: 'migrations/001-posts.ts',
      files: { 'migrations/001-users.md': '' },
      code: 'export {}',
      options: { pattern: '^\\d{3}-.*\\.ts$', message: 'Start with NNN-.', unique: '^(\\d{3})-' },
    },
    {
      name: 'the whole match is the key without a group',
      filename: 'migrations/001-posts.ts',
      files: { 'migrations/001-users.ts': '' },
      code: 'export {}',
      options: { pattern: '^\\d{3}-', message: 'Start with NNN-.', unique: '^\\d{3}-[a-z]+' },
    },
    {
      name: 'several option objects pass',
      filename: '001-users.ts',
      code: 'export {}',
      options: [
        { pattern: '^[a-z0-9-]+\\.ts$', message: 'Use kebab-case file names.' },
        { pattern: '^\\d{3}-', message: 'Start with NNN-.' },
      ],
    },
    {
      name: 'a name off the pattern',
      filename: 'UserCard.tsx',
      code: 'export {}',
      options: { pattern: '^[a-z0-9-]+\\.tsx?$', message: 'Use kebab-case file names.' },
      errors: ['mismatch'],
    },
    {
      name: 'a missing environment suffix',
      filename: 'billing.spec.ts',
      code: 'export {}',
      options: { pattern: '\\.(auth|public)\\.spec\\.ts$', message: 'E2E specs must include their environment suffix.' },
      errors: ['mismatch'],
    },
    {
      name: 'each option object reports',
      filename: 'Users.ts',
      code: 'export {}',
      options: [
        { pattern: '^[a-z0-9-]+\\.ts$', message: 'Use kebab-case file names.' },
        { pattern: '^\\d{3}-', message: 'Start with NNN-.' },
      ],
      errors: ['mismatch', 'mismatch'],
    },
    {
      name: 'a repeated key',
      filename: 'migrations/001-posts.ts',
      files: { 'migrations/001-users.ts': '', 'migrations/002-teams.ts': '' },
      code: 'export {}',
      options: { pattern: '^\\d{3}-', message: 'Start with NNN-.', unique: '^(\\d{3})-' },
      errors: ['duplicate'],
    },
  ])('$name', (row) => testerRun(namingFile, row))
})
