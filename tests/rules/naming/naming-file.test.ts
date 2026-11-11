import { describe, it } from 'vitest'
import { namingFile } from '../../../src/rules/naming/naming-file.ts'
import { testerRun } from '../../utils/tester.utils.ts'

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
      name: 'a name off the pattern reports its message',
      filename: 'UserCard.tsx',
      code: 'export {}',
      options: { pattern: '^[a-z0-9-]+\\.tsx?$', message: 'Use kebab-case file names.' },
      errors: ['Use kebab-case file names.'],
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
    {
      name: 'two dated migrations of the same year are unique',
      filename: 'migrations/2026-11-12-10-00-create-news-table.ts',
      files: { 'migrations/2026-11-13-09-00-create-orders-table.ts': '' },
      code: 'export {}',
      options: { pattern: '^\\d', message: 'Start with a number.', unique: '^(\\d{4}-\\d{2}-\\d{2}(?:-\\d{2})*|\\d{3,14})[-_]' },
    },
    {
      name: 'two migrations of the same date are duplicates',
      filename: 'migrations/2026-11-12-a.ts',
      files: { 'migrations/2026-11-12-b.ts': '' },
      code: 'export {}',
      options: { pattern: '^\\d', message: 'Start with a number.', unique: '^(\\d{4}-\\d{2}-\\d{2}(?:-\\d{2})*|\\d{3,14})[-_]' },
      errors: ['duplicate'],
    },
    {
      name: 'two numbered migrations with one number are duplicates',
      filename: 'migrations/001-a.ts',
      files: { 'migrations/001-b.ts': '' },
      code: 'export {}',
      options: { pattern: '^\\d', message: 'Start with a number.', unique: '^(\\d{4}-\\d{2}-\\d{2}(?:-\\d{2})*|\\d{3,14})[-_]' },
      errors: ['duplicate'],
    },
    {
      name: 'a number followed by digits reads only the number',
      filename: 'migrations/001-2-factor.ts',
      files: { 'migrations/001-3-other.ts': '' },
      code: 'export {}',
      options: { pattern: '^\\d', message: 'Start with a number.', unique: '^(\\d{4}-\\d{2}-\\d{2}(?:-\\d{2})*|\\d{3,14})[-_]' },
      errors: ['duplicate'],
    },
  ])('$name', (row) => testerRun(namingFile, row))
})
