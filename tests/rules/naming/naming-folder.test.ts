import { describe, it } from 'vitest'
import { namingFolder } from '../../../src/rules/naming/naming-folder.ts'
import { testerRun } from '../../utils/tester.utils.ts'

describe('arch/naming-folder', () => {
  it.each([
    { name: 'the folder prefix passes', filename: 'sidebar/sidebar-rail.tsx', code: 'export {}' },
    { name: 'the singular prefix passes', filename: 'invoices/invoice-create.ts', code: 'export {}' },
    { name: 'the folder name alone passes', filename: 'dialogs/dialog.tsx', code: 'export {}' },
    { name: 'a custom separator passes', filename: 'invoices/invoice.create.ts', code: 'export {}', options: { separators: ['-', '.'] } },
    {
      name: 'folders after the marker join',
      filename: 'src/components/admin/insights/admin-insights-chart.tsx',
      code: 'export {}',
      options: { after: 'components' },
    },
    { name: 'a multi-part marker passes', filename: 'src/features/billing/billing-page.tsx', code: 'export {}', options: { after: 'src/features' } },
    { name: 'a file in the marker folder uses its parent', filename: 'src/components/component-list.tsx', code: 'export {}', options: { after: 'components' } },
    { name: 'files outside the marker are skipped', filename: 'src/lib/create.ts', code: 'export {}', options: { after: 'components' } },
    { name: 'an ignored prefix passes', filename: 'users/use-user-query.ts', code: 'export {}', options: { prefixes: ['use-'] } },
    { name: 'a name off the folder', filename: 'invoices/create.ts', code: 'export {}', errors: ['prefix'] },
    { name: 'a prefix without a separator', filename: 'sidebar/sidebarrail.tsx', code: 'export {}', errors: ['prefix'] },
    { name: 'the plural without singularize', filename: 'invoices/invoice-create.ts', code: 'export {}', options: { singularize: 'none' }, errors: ['prefix'] },
    { name: 'a dot without a custom separator', filename: 'invoices/invoice.create.ts', code: 'export {}', errors: ['prefix'] },
    {
      name: 'only the last folder after the marker',
      filename: 'src/components/admin/insights/insights-chart.tsx',
      code: 'export {}',
      options: { after: 'components' },
      errors: ['prefix'],
    },
    { name: 'use- is not stripped without prefixes', filename: 'users/use-user-query.ts', code: 'export {}', errors: ['prefix'] },
  ])('$name', (row) => testerRun(namingFolder, row))
})
