import { preset } from 'oxlint-plugin-arch/preset'

export default preset({
  root: import.meta.dirname,
  sets: {
    kits: { 'kit-auth': 'auth', 'kit-payments': 'payment' },
    writes: ['insertInto', 'updateTable', 'deleteFrom'],
  },
  folders: {
    'apps/server/src': {
      deny: { only: [{ each: 'kits', imports: ['@scope/{key}', '@scope/{key}/*'], in: 'apps/server/src/domains/{value}', message: 'Call the {value} domain.' }] },
      naming: { imports: { '@scope/kit-{package}/{subpath}': '{Package}Kit{Subpath}', '@scope/kit-{package}': '{Package}Kit' } },
    },
    'apps/server/src/domains/*/*.queries.ts': { deny: { calls: { '{writes}': 'A query reads only.' } } },
    'apps/server/tests/**/*.test.ts': { top: ['describe', 'it', 'it.each'] },
    'packages/contract/src/*/*.schemas.ts': { top: { allow: ['type', { kind: 'const', from: '^Schema\\.', exported: true }] } },
  },
})
