import preset from 'oxlint-plugin-arch/presets/tanstack-start-react-modules-preset';

export default preset({
  root: import.meta.dirname,
  architecture: { 'apps/web': 'web', 'apps/server': 'server', 'apps/runner': 'runner', packages: 'packages', scripts: 'scripts' },
  orpc: { publicProcedureFiles: ['apps/server/src/rpc/public/**/*.ts'] },
  severity: 'warn',
  cliFiles: ['apps/server/src/entry.cli.ts'],
  policies: { typePlacement: false, comments: (current) => [
    ...current,
    {
      files: ['apps/server/src/portable/**/*.ts'],
      rules: { 'arch/no-comments': 'off' },
    },
  ] },
  ruleExclusions: { 'no-console': ['packages/logger/src/index.ts'], 'modules/no-unknown': ['apps/server/src/portable/**/*.ts'] },
  ignorePatterns: ['apps/server/src/ignored/**'],
});
