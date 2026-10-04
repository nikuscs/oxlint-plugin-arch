import preset from 'oxlint-plugin-arch/presets/tanstack-start-react-modules-preset';

export default preset({
  root: import.meta.dirname,
  architecture: { 'apps/web': 'web', 'apps/server': 'server', 'apps/runner': 'runner', packages: 'packages', scripts: 'scripts' },
  orpc: { publicProcedureFiles: ['apps/server/src/rpc/public/**/*.ts'] },
  ruleExclusions: { 'no-console': ['packages/logger/src/index.ts'] },
  imports: { aliases: { '@backend': 'apps/server/src' } },
});
