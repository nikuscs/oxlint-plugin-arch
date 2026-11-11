import { preset } from 'oxlint-plugin-arch/preset'

export default preset({
  root: import.meta.dirname,
  folders: {
    '.': { deny: { imports: { '@acme/kit-queues': 'Workflows are the only background primitive.' } } },
    'apps/server/src/domains': {
      deny: { imports: { '@acme/kit-!(contracts)/!(schema|contract)': 'Never a kit driver subpath.' } },
    },
    'alchemy.*.ts': { rules: { 'import-extra/no-relative-packages': 'off' } },
  },
})
